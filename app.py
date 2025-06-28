from flask import Flask, render_template, jsonify, request
import pandas as pd

app = Flask(__name__)

# loading data sets heree. ..
hospitals_df = pd.read_csv("data/hospitals.csv")
preschools_df = pd.read_csv("data/preschools.csv")
students_df = pd.read_csv("data/student_schools.csv")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/<dataset>")
def get_data(dataset):
    df = None
    if dataset == "hospitals":
        df = hospitals_df.copy()
    elif dataset == "preschools":
        df = preschools_df.copy()
    elif dataset == "students":
        df = students_df.copy()
    else:
        return jsonify({"error": "Invalid dataset"}), 400

    region = request.args.get("region")
    district = request.args.get("district")

    # Convert filter columns to string explicitly
    if region:
        df = df[df[df.columns[0]].astype(str).str.contains(region, na=False, case=False)]
    if district:
        df = df[df[df.columns[1]].astype(str).str.contains(district, na=False, case=False)]

    return df.to_json(orient="records")


@app.route("/api/<dataset>/filters")
def get_filters(dataset):
    df = None
    if dataset == "hospitals":
        df = hospitals_df.copy()
    elif dataset == "preschools":
        df = preschools_df.copy()
    elif dataset == "students":
        df = students_df.copy()
    else:
        return jsonify({"error": "Invalid dataset"}), 400

    regions = sorted(df[df.columns[0]].dropna().astype(str).unique().tolist())
    districts = sorted(df[df.columns[1]].dropna().astype(str).unique().tolist())

    return jsonify({
        "regions": regions,
        "districts": districts
    })

@app.route("/deepseek_chat_bot", methods=["POST"])
def deepseek_chat_bot():
    from openai import OpenAI
    import os
    from dotenv import load_dotenv
    load_dotenv()
    data = request.get_json()
    user_message = data.get('message', '')
    if not user_message:
        return jsonify({'response': 'No message provided.'}), 400

    # Only send column names and first 2 rows of each dataset
    hospitals_sample = hospitals_df.head(2).to_string()
    preschools_sample = preschools_df.head(2).to_string()
    students_sample = students_df.head(2).to_string()
    context = (
        "Hospitals Data Columns: " + ', '.join(hospitals_df.columns) +
        "\nSample:\n" + hospitals_sample +
        "\n\nPreschools Data Columns: " + ', '.join(preschools_df.columns) +
        "\nSample:\n" + preschools_sample +
        "\n\nStudents Data Columns: " + ', '.join(students_df.columns) +
        "\nSample:\n" + students_sample
    )

    messages = [
        {"role": "system", "content": f"You have access to the following data samples:\n{context}"},
        {"role": "user", "content": user_message}
    ]

    api_key = os.getenv('open_router_key')
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )
    try:
        completion = client.chat.completions.create(
            model="mistralai/mistral-7b-instruct",
            messages=messages
        )
        ai_message = completion.choices[0].message.content
        return jsonify({'response': ai_message})
    except Exception as e:
        return jsonify({'response': f'Error: {str(e)}'}), 500

if __name__ == "__main__":
    print('Registered routes:')
    for rule in app.url_map.iter_rules():
        print(rule)
    app.run(host='0.0.0.0', port=8000, debug=True)
