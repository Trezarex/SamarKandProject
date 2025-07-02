from flask import Flask, render_template, request, jsonify
import pandas as pd
import os
from dotenv import load_dotenv
import logging
import time

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)


# Data paths
DATASET_PATHS = {
    "hospital": "data/final_hos_df.csv",
    "school": "data/final_school_df.csv",
    "preschool": "data/final_preschool_df.csv"
}

def load_data(key):
    path = DATASET_PATHS.get(key)
    if not path or not os.path.exists(path):
        return None
    return pd.read_csv(path)

@app.route("/")
def home():
    return render_template("Index.html")

@app.route("/api/hospital-data")
def hospital_data():
    df = load_data("hospital")
    if df is None:
        return jsonify({"error": "Hospital data not found"}), 404
    return jsonify(df.to_dict(orient="records"))

@app.route("/api/school-data")
def school_data():
    df = load_data("school")
    if df is None:
        return jsonify({"error": "School data not found"}), 404
    df = df.fillna(0)
    return jsonify(df.to_dict(orient="records"))

@app.route("/api/preschool-data")
def preschool_data():
    df = load_data("preschool")
    if df is None:
        return jsonify({"error": "Preschool data not found"}), 404
    return jsonify(df.to_dict(orient="records"))


# Add caching for dataset context
DATASET_CONTEXT_CACHE = None
CONTEXT_CACHE_TIMESTAMP = 0
CACHE_DURATION = 600  # 10 minutes

def get_dataset_context():
    global DATASET_CONTEXT_CACHE, CONTEXT_CACHE_TIMESTAMP
    
    # Return cached context if valid
    if (DATASET_CONTEXT_CACHE and 
        time.time() - CONTEXT_CACHE_TIMESTAMP < CACHE_DURATION):
        return DATASET_CONTEXT_CACHE
    
    # Load datasets
    hospital_df = load_data("hospital")
    school_df = load_data("school")
    preschool_df = load_data("preschool")
    
    if hospital_df is None or school_df is None or preschool_df is None:
        return None
    
    # Prepare context
    context = "\n".join([
        "=== Hospital Data ===",
        prepare_data_context(hospital_df),
        "=== School Data ===",
        prepare_data_context(school_df),
        "=== Preschool Data ===",
        prepare_data_context(preschool_df)
    ])
    
    # Update cache
    DATASET_CONTEXT_CACHE = context
    CONTEXT_CACHE_TIMESTAMP = time.time()
    
    return context

@app.route("/deepseek_chat_bot", methods=["POST"])
def deepseek_chat_bot():
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'response': 'Please provide a valid message.'}), 400
        
        logger.info(f"Chat request: {user_message}")
        
        # Get cached context
        context = get_dataset_context()
        if not context:
            return jsonify({'response': 'Data unavailable. Please try again later.'}), 500
        
        # Get AI response
        ai_response = get_ai_response(user_message, context)
        
        # Format tables
        if "|" in ai_response and "\n" in ai_response:
            ai_response = format_table_response(ai_response)
            
        logger.info("Chat response generated")
        return jsonify({'response': ai_response})

    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return jsonify({'response': 'Error processing your request'}), 500

def format_table_response(text):
    lines = text.split('\n')
    
    filtered = [line for line in lines if line.strip() and not line.startswith('|-')]
    
    return '\n'.join(
        f"| {line.strip().replace('|', ' | ')} |" 
        if '|' in line else line
        for line in filtered
    )
def prepare_data_context(df):
    try:
        if df is None or df.empty:
            return "No data available."
            
        # Get basic statistics
        total_records = len(df)
        columns = list(df.columns)
        
        # Get sample data
        sample_data = df.head(3).to_string(index=False)
        
        # Calculate some basic stats
        numeric_columns = df.select_dtypes(include=['number']).columns
        stats = {}
        for col in numeric_columns:
            if not df[col].empty:
                stats[col] = {
                    'mean': df[col].mean(),
                    'min': df[col].min(),
                    'max': df[col].max()
                }
        
        context = f"""
            Dataset Information:
            - Total records: {total_records}
            - Columns: {', '.join(columns)}

            Sample Data:
            {sample_data}

            Key Statistics:
            """
        for col, stat in stats.items():
            context += f"- {col}: avg={stat['mean']:.2f}, min={stat['min']:.2f}, max={stat['max']:.2f}\n"
            
        return context
        
    except Exception as e:
        logger.error(f"Error preparing context: {str(e)}")
        return "Data context unavailable."

def get_ai_response(user_message, context):
    try:
        from openai import OpenAI
        
        api_key = os.getenv('OPENROUTER_API_KEY') or os.getenv('open_router_key')
        if not api_key:
            logger.warning("No OpenRouter API key found")
            return generate_fallback_response(user_message, context)
            
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )
        
        system_prompt = f"""You are a helpful data analyst assistant for the Samarkand healthcare dashboard. 
            You have access to hospital data from the Samarkand region. 

            {context}

            Please provide helpful, accurate responses about the data. If asked about specific metrics, 
            refer to the data context provided. Keep responses concise and informative."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        
        completion = client.chat.completions.create(
            model="mistralai/mistral-7b-instruct",
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )
        
        response = completion.choices[0].message.content
        return response
        
    except Exception as e:
        logger.error(f"Error getting AI response: {str(e)}")
        return generate_fallback_response(user_message, context)

def generate_fallback_response(user_message, context):
    message_lower = user_message.lower()
    
    if any(word in message_lower for word in ['average', 'mean', 'satisfaction']):
        return "Based on the available data, I can help you analyze satisfaction scores and other metrics. The hospital dataset contains information about infrastructure, resources, and satisfaction ratings across different regions in Samarkand."
    
    elif any(word in message_lower for word in ['region', 'district', 'location']):
        return "The dataset includes hospitals from various regions and districts in Samarkand. You can filter the dashboard by region and district to see specific area performance."
    
    elif any(word in message_lower for word in ['infrastructure', 'building', 'facility']):
        return "The infrastructure scores in the dataset reflect the physical condition and facilities of hospitals, including building quality, utilities, and equipment."
    
    elif any(word in message_lower for word in ['resources', 'staff', 'capacity']):
        return "Resource scores indicate staffing levels, bed capacity, and available medical resources at each hospital facility."
    
    else:
        return "I can help you analyze the Samarkand hospital data. Try asking about satisfaction scores, regional comparisons, infrastructure quality, or resource availability."

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000, debug=True)
