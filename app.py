from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

# Load data from JSON files
def load_data(filename):
    data_path = os.path.join(app.static_folder, 'data', filename)
    with open(data_path, 'r', encoding='utf-8') as f:
        return json.load(f)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/centers')
def get_centers():
    try:
        centers = load_data('centers.json')
        return jsonify(centers)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/departments/<center_id>')
def get_departments(center_id):
    try:
        departments = load_data(f'departments_{center_id}.json')
        return jsonify(departments)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/doctors/<department_id>')
def get_doctors(department_id):
    try:
        doctors = load_data(f'doctors_{department_id}.json')
        return jsonify(doctors)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/schedule/<doctor_id>')
def get_schedule(doctor_id):
    try:
        schedule = load_data(f'schedule_{doctor_id}.json')
        return jsonify(schedule)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/book_appointment', methods=['POST'])
def book_appointment():
    data = request.json
    # Here you would save the appointment to a database
    # For now, we'll just return success
    return jsonify({"status": "success", "message": "Appointment booked successfully"})

if __name__ == '__main__':
    # Make sure the data directory exists
    os.makedirs(os.path.join(app.static_folder, 'data'), exist_ok=True)
    
    # Create initial sample data if it doesn't exist
    centers_file = os.path.join(app.static_folder, 'data', 'centers.json')
    if not os.path.exists(centers_file):
        with open(centers_file, 'w', encoding='utf-8') as f:
            json.dump([
                {
                    "id": 1,
                    "name": "Ljubljana Medical Center",
                    "lat": 46.0569,
                    "lng": 14.5058,
                    "address": "Zaloška cesta 7, 1000 Ljubljana"
                },
                {
                    "id": 2,
                    "name": "Maribor Health Clinic",
                    "lat": 46.5547,
                    "lng": 15.6467,
                    "address": "Ljubljanska ulica 5, 2000 Maribor"
                },
                {
                    "id": 3,
                    "name": "Koper Regional Hospital",
                    "lat": 45.5469,
                    "lng": 13.7294,
                    "address": "Polje 40, 6310 Izola"
                }
            ], f, indent=2)
    
    app.run(debug=True)
