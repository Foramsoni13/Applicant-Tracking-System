from flask import Flask, request, jsonify
from flask_cors import CORS
from poster_generator import generate_posters

app = Flask(__name__)
CORS(app)


# ==========================================
# Home Route
# ==========================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "success": True,
        "message": "AI ATS Image Processing Service is Running"
    })


# ==========================================
# Generate AI Posters
# ==========================================

@app.route("/generate-posters", methods=["POST"])
def generate_job_posters():

    try:

        data = request.get_json()

        if not data:

            return jsonify({
                "success": False,
                "message": "No JSON data received."
            }), 400


        job = {

            "title": data.get("title", ""),
            "company": data.get("company", ""),
            "location": data.get("location", ""),
            "salary": data.get("salary", ""),
            "experience": data.get("experience", ""),
            "employmentType": data.get("employmentType", ""),
            "skills": data.get("skills", []),
            "description": data.get("description", ""),
            "companyLogo": data.get("companyLogo", "")

        }


        print("\n==============================")
        print("Generating Posters...")
        print("==============================")

        posters = generate_posters(job)

        print(posters)

        return jsonify({

            "success": True,
            "message": "Posters generated successfully.",
            "posters": posters

        })


    except Exception as e:

        print(e)

        return jsonify({

            "success": False,
            "message": str(e)

        }), 500


# ==========================================
# Run Server
# ==========================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True
    )