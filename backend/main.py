from flask import Flask, request, jsonify
from flask_cors import CORS  # Use flask-cors
import fitz  # PyMuPDF
import os
from dotenv import load_dotenv
from mistralai import Mistral

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)  # Configure CORS

MIXTRAL_API_KEY = os.getenv("MIXTRAL_API_KEY")
print("🔑 Loaded API Key:", MIXTRAL_API_KEY)

mistral_client = Mistral(api_key=MIXTRAL_API_KEY)

def extract_text_from_pdf(file):
    try:
        pdf_document = fitz.open(stream=file.read(), filetype="pdf")
        text = "\n".join([page.get_text("text") for page in pdf_document]) #type: ignore
        return text
    except Exception as e:
        print("❌ Error extracting text:", str(e))
        return "Error extracting text"

def analyze_resume_with_mistral(text, job_description):
    prompt = f"""
    Given the following resume:
    {text}

    Compare it with the job description:
    {job_description}

    Provide:
    - A match percentage
    - Missing skills
    - Suggestions for improvement
    """

    try:
        response = mistral_client.chat.complete(
            model="mistral-small-2501",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )

        print("🔍Mixtral AI response:", response)

        analysis_text = response.choices[0].message.content #type: ignore
        return {"analysis": analysis_text}

    except Exception as e:
        print(f"❌ Mistral API Error: {str(e)}")
        return {"error": f"Mistral API Error: {str(e)}"}

@app.route("/upload-resume/", methods=["POST"])
def upload_resume():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    job_description = request.form.get('job_description')

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    text = extract_text_from_pdf(file)
    if text == "Error extracting text":
        return jsonify({"error": "Failed to extract text from PDF"}), 500

    result = analyze_resume_with_mistral(text, job_description)
    return jsonify({"analysis": result})

@app.route("/", methods=["GET"])
def read_root():
    return jsonify({"message": "Hello World"})

if __name__ == "__main__":
    app.run(debug=True)
