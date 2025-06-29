from flask import Flask, render_template, request, jsonify, redirect, send_from_directory
import pandas as pd
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route("/")
def root():
    """Serve the main dashboard page"""
    return render_template('Index.html')

# Dataset paths
DATASET_PATHS = {
    "hospital": "data/final_hos_df.csv",
    "school": "data/final_school_df.csv", 
    "preschool": "data/final_preschool_df.csv"
}

def load_dataset(key):
    """Load dataset from CSV by key ('hospital', 'school', 'preschool')"""
    try:
        if key not in DATASET_PATHS:
            logger.warning(f"Unknown dataset key: {key}")
            return None

        path = DATASET_PATHS[key]
        if not os.path.exists(path):
            logger.error(f"Dataset not found: {path}")
            return None

        return pd.read_csv(path)
    except Exception as e:
        logger.error(f"Error loading dataset {key}: {str(e)}")
        return None


@app.route("/api/hospital-data", methods=["GET"])
def get_hospital_data():
    try:
        df = load_dataset("hospital")
        if df is None:
            return jsonify({"error": "Hospital data not found"}), 404

        # Get optional filters
        region = request.args.get("region", "").strip()
        district = request.args.get("district", "").strip()
        hospital_name = request.args.get("hospital_name", "").strip()

        # Apply filters
        if region:
            df = df[df["region"].str.lower() == region.lower()]
        if district:
            df = df[df["district"].str.lower() == district.lower()]
        if hospital_name:
            df = df[df["hospital_name"].str.lower() == hospital_name.lower()]

        # Summary metrics
        summary = {
            "total_count": len(df),
            "avg_satisfaction": round(df["population_score"].mean(), 2),
            "infrastructure_score": round(df["infrastructure_score"].mean(), 2),
            "resources_score": round(df["resources_score"].mean(), 2)
        }

        # Chart data
        chart_data = {
            "infra_vs_resources": df[["hospital_name", "district", "infrastructure_score", "resources_score"]].dropna().to_dict(orient="records"),
            "satisfaction_distribution": df["population_score"].dropna().tolist(),
            "regional_comparison": df.groupby("region")[["infrastructure_score", "resources_score"]].mean().round(2).reset_index().to_dict(orient="records"),
            "performance_metrics": {
                "labels": ["Infrastructure", "Resources", "Population", "Age"],
                "values": [
                    round(df["infrastructure_score"].mean(), 2),
                    round(df["resources_score"].mean(), 2),
                    round(df["population_score"].mean(), 2),
                    round(df["age_score"].mean(), 2)
                ]
            }
        }

        return jsonify({"summary": summary, "charts": chart_data})

    except Exception as e:
        logger.error(f"Error fetching hospital data: {str(e)}")
        return jsonify({"error": "Failed to process hospital data"}), 500
    
@app.route("/api/school-data", methods=["GET"])
def get_school_data():
    try:
        df = load_dataset("school")
        if df is None:
            return jsonify({"error": "School data not found"}), 404

        # Filters
        region = request.args.get("region", "").strip()
        district = request.args.get("district", "").strip()
        school_name = request.args.get("school_name", "").strip()

        if region:
            df = df[df["region"].str.lower() == region.lower()]
        if district:
            df = df[df["district"].str.lower() == district.lower()]
        if school_name:
            df = df[df["school_name"].str.lower() == school_name.lower()]

        # Summary
        summary = {
            "total_count": len(df),
            "avg_satisfaction": round(df["population_score"].mean(), 2),
            "infrastructure_score": round(df["infrastructure_score"].mean(), 2),
            "resources_score": round(df["resources_score"].mean(), 2)
        }

        # Charts
        chart_data = {
            "infra_vs_resources": df[["school_name", "district", "infrastructure_score", "resources_score"]].dropna().to_dict(orient="records"),
            "satisfaction_distribution": df["population_score"].dropna().tolist(),
            "regional_comparison": df.groupby("region")[["infrastructure_score", "resources_score"]].mean().round(2).reset_index().to_dict(orient="records"),
            "performance_metrics": {
                "labels": ["Infrastructure", "Resources", "Population"],
                "values": [
                    round(df["infrastructure_score"].mean(), 2),
                    round(df["resources_score"].mean(), 2),
                    round(df["population_score"].mean(), 2)
                ]
            }
        }

        return jsonify({"summary": summary, "charts": chart_data})

    except Exception as e:
        logger.error(f"Error fetching school data: {str(e)}")
        return jsonify({"error": "Failed to process school data"}), 500


@app.route("/api/preschool-data", methods=["GET"])
def get_preschool_data():
    try:
        df = load_dataset("preschool")
        if df is None:
            return jsonify({"error": "Preschool data not found"}), 404

        # Optional filters
        region = request.args.get("region", "").strip()
        district = request.args.get("district", "").strip()
        preschool_name = request.args.get("preschool_name", "").strip()

        if region:
            df = df[df["region"].str.lower() == region.lower()]
        if district:
            df = df[df["district"].str.lower() == district.lower()]
        if preschool_name:
            df = df[df["preschool_name"].str.lower() == preschool_name.lower()]

        # Summary
        summary = {
            "total_count": len(df),
            "avg_satisfaction": round(df["population_score"].mean(), 2),
            "infrastructure_score": round(df["infrastructure_score"].mean(), 2),
            "resources_score": round(df["resources_score"].mean(), 2)
        }

        # Charts
        chart_data = {
            "infra_vs_resources": df[["kindergarten_name", "district", "infrastructure_score", "resources_score"]].dropna().to_dict(orient="records"),
            "satisfaction_distribution": df["population_score"].dropna().tolist(),
            "regional_comparison": df.groupby("region")[["infrastructure_score", "resources_score"]].mean().round(2).reset_index().to_dict(orient="records"),
            "performance_metrics": {
                "labels": ["Infrastructure", "Resources", "Population", "Age"],
                "values": [
                    round(df["infrastructure_score"].mean(), 2),
                    round(df["resources_score"].mean(), 2),
                    round(df["population_score"].mean(), 2),
                    round(df["age_score"].mean(), 2) if "age_score" in df.columns else None
                ]
            }
        }

        return jsonify({"summary": summary, "charts": chart_data})

    except Exception as e:
        logger.error(f"Error fetching preschool data: {str(e)}")
        return jsonify({"error": "Failed to process preschool data"}), 500



@app.route("/chat", methods=["POST"])
def chat():
    """Chatbot endpoint"""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'reply': 'No message provided.'}), 400
            
        user_message = data['message'].strip()
        if not user_message:
            return jsonify({'reply': 'Please provide a valid message.'}), 400
            
        logger.info(f"Chat request: {user_message}")
        
        # Load hospital data for contex
        hospital_df = load_dataset("hospital")
        if hospital_df is None:
            return jsonify({'reply': 'Sorry, I cannot access the data right now.'}), 500
            
        # Prepare context for AI
        context = prepare_data_context(hospital_df)
        
        # Get AI response
        ai_response = get_ai_response(user_message, context)
        
        logger.info(f"Chat response generated successfully")
        return jsonify({'reply': ai_response})
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({'reply': 'Sorry, I encountered an error processing your request.'}), 500

def prepare_data_context(df):
    """Prepare data context for AI chatbot"""
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
    """Get AI response using OpenRouter API"""
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
    """Generate a fallback response when AI is unavailable"""
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

@app.errorhandler(404)
def not_found(error):
    return send_from_directory('.', 'index.html')

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    print('=== Samarkand Dashboard Server ===')
    print('Registered routes:')
    for rule in app.url_map.iter_rules():
        print(f"  {rule.rule} -> {rule.endpoint}")
    
    print(f"\nStarting server on http://0.0.0.0:8000")
    print("Dashboard will be available at: http://localhost:8000")
    
    app.run(host='0.0.0.0', port=8000, debug=True)
