from flask import Flask, render_template, request, jsonify
import pandas as pd
import os
import logging
import time
from dotenv import load_dotenv

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


def prepare_data_context(df):
    try:
        if df is None or df.empty:
            return "No data available."
            
        # Get basic statistics
        total_records = len(df)
        columns = list(df.columns)
        total_districts_list = list(df['district'])
        infrastructure_score = dict(zip(df['district'], df['infrastructure_score']))
        resources_score = dict(zip(df['district'], df['resources_score']))
        population_score = dict(zip(df['district'], df['population_score']))
        
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
            - Districts: {", ".join(total_districts_list)}
            - Infrastructure Score: {infrastructure_score}
            - Resources Score: {resources_score}
            - Population Score: {population_score}


            Key Statistics:
            """
        for col, stat in stats.items():
            context += f"- {col}: avg={stat['mean']:.2f}, min={stat['min']:.2f}, max={stat['max']:.2f}\n"
            
        return context
        
    except Exception as e:
        logger.error(f"Error preparing context: {str(e)}")
        return "Data context unavailable."

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

def format_table_response(text):
    lines = text.split('\n')
    
    filtered = [line for line in lines if line.strip() and not line.startswith('|-')]
    
    return '\n'.join(
        f"| {line.strip().replace('|', ' | ')} |" 
        if '|' in line else line
        for line in filtered
    )


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

        # Improved system prompt with examples and more guidance
        system_prompt = f"""
You are a data analyst assistant for the Samarkand social infrastructure dashboard.
You have access to hospital, school, and preschool datasets for the Samarkand region.

DATA CONTEXT:
{context}

Instructions:
- Answer user questions using the data context above.
- If the user asks for statistics, provide specific numbers from the context.
- If the user asks for comparisons, highlight differences using the data.
- If the user asks for trends or insights, summarize key findings from the data.
- If you don't have enough data, say so.

Example Q&A:
Q: What is the average satisfaction score for hospitals?
A: The average satisfaction score for hospitals is provided in the data context above.

Q: Which district has the lowest infrastructure score?
A: According to the data, the district with the lowest infrastructure score is listed in the statistics above.

Be concise, accurate, and helpful. Make sure to give the data for all the values in the "district" column of each dataset.
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]

        # Optionally, use a more capable model if available
        completion = client.chat.completions.create(
            model="mistralai/mistral-7b-instruct",  # Change to a more capable model if available
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
    # Try to extract some numbers from context for a more dynamic fallback
    lines = context.split('\n') if context else []
    stats_lines = [line for line in lines if 'avg=' in line]
    stats_summary = "\n".join(stats_lines[:3]) if stats_lines else ""

    message_lower = user_message.lower()

    if any(word in message_lower for word in ['average', 'mean', 'satisfaction']):
        return f"Here are some key statistics from the data:\n{stats_summary}" if stats_summary else \
            "Based on the available data, I can help you analyze satisfaction scores and other metrics. The hospital dataset contains information about infrastructure, resources, and satisfaction ratings across different regions in Samarkand."

    elif any(word in message_lower for word in ['region', 'district', 'location']):
        return "The dataset includes hospitals, schools, and preschools from various regions and districts in Samarkand. You can filter the dashboard by region and district to see specific area performance."

    elif any(word in message_lower for word in ['infrastructure', 'building', 'facility']):
        return "The infrastructure scores in the dataset reflect the physical condition and facilities of hospitals, schools, and preschools, including building quality, utilities, and equipment."

    elif any(word in message_lower for word in ['resources', 'staff', 'capacity']):
        return "Resource scores indicate staffing levels, bed capacity, and available resources at each facility."

    else:
        return "I can help you analyze the Samarkand social infrastructure data. Try asking about satisfaction scores, regional comparisons, infrastructure quality, or resource availability."

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


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000, debug=True)
