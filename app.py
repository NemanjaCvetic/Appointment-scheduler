
from flask import Flask, render_template, request, redirect, url_for, flash, session
from supabase import create_client, Client
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user

app = Flask(__name__)
app.secret_key = 'tvoj-secret-key'  # Promeni za produkciju

# Supabase podešavanja
SUPABASE_URL = "https://tbignzooatxqmwiszeka.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiaWduem9vYXR4cW13aXN6ZWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4NTE4ODgsImV4cCI6MjA1ODQyNzg4OH0.Dq1DJc2RHRT9wljbeemiWI1qbr4S8gGMIomz3hkJCgA"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Podešavanje Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

class User(UserMixin):
    def __init__(self, id, role, email):
        self.id = id
        self.role = role
        self.email = email

@login_manager.user_loader
def load_user(user_id):
    # Uzimamo role iz sesije
    role = session.get('user_role')
    
    if role == 'patient':
        patient_response = supabase.table('patients').select('id, email').eq('id', user_id).execute()
        if patient_response.data:
            return User(patient_response.data[0]['id'], role, patient_response.data[0]['email'])
    elif role == 'doctor':
        doctor_response = supabase.table('doctors').select('id, email').eq('id', user_id).execute()
        if doctor_response.data:
            return User(doctor_response.data[0]['id'], role, doctor_response.data[0]['email'])
    elif role == 'admin':
        if user_id == 'admin':
            return User('admin', 'admin', 'admin@gmail.com')
    
    return None

# Login ruta
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        # Check patients table
        response = supabase.table('patients')\
            .select('id, email')\
            .eq('email', email)\
            .eq('password', password)\
            .execute()
        if response and response.data:
            user_data = response.data[0]
            user = User(user_data['id'], 'patient', user_data['email'])
            session['user_role'] = 'patient'
            login_user(user)
            return redirect(url_for('index'))

        # Check doctors table
        response = supabase.table('doctors')\
            .select('id, email')\
            .eq('email', email)\
            .eq('password', password)\
            .execute()
        if response and response.data:
            user_data = response.data[0]
            user = User(user_data['id'], 'doctor', user_data['email'])
            session['user_role'] = 'doctor'
            login_user(user)
            return redirect(url_for('index'))

        # Check admin (special case)
        if email == 'admin@gmail.com' and password == 'admin':
            user = User('admin', 'admin', 'admin@gmail.com')
            session['user_role'] = 'admin'
            login_user(user)
            return redirect(url_for('index'))

        flash('Invalid login credentials')
    return render_template('login.html')

# Logout ruta
@app.route('/logout')
@login_required
def logout():
    session.pop('user_role', None)  # Brišemo role iz sesije
    logout_user()
    return redirect(url_for('index'))

# Početna stranica sa mapom
@app.route('/')
def index():
    hospitals_data = supabase.table('hospitals').select('id, name, address, city, latitude, longitude').execute().data
    num_hospital=len(hospitals_data)
    doctors_data = supabase.table('doctors').select('id, name, specialty, hospital_id').execute().data
    num_doctors=len(doctors_data)
    hospitals = hospitals_data if hospitals_data else []
    doctors = doctors_data if doctors_data else []
    num_app=len(supabase.table('appointments').select('*').execute().data)
    print(num_app)
    
    return render_template('index.html', hospitals=hospitals, doctors=doctors,num_hospital=num_hospital,num_doctors=num_doctors,num_app=num_app)

# Zdravstveni karton - zaštićeno
@app.route('/health-record')
@login_required
def health_record():
    if current_user.role == 'patient':
        patient_id = current_user.id
        patient_response = supabase.table('patients').select('*').eq('id', patient_id).execute()
        patient = patient_response.data[0] if patient_response.data else None
        appointments_response = supabase.table('appointments')\
            .select('id, date, time, reason, findings, is_completed, doctors(name, specialty), hospitals(name, city)')\
            .eq('patient_id', patient_id).execute()
        appointments = appointments_response.data
    elif current_user.role == 'doctor':
        doctor_id = current_user.id
        appointments_response = supabase.table('appointments')\
            .select('id, patients(first_name,last_name), date, time, reason, findings, is_completed, hospitals(name, city)')\
            .eq('doctor_id', doctor_id)\
            .eq('is_completed', False)\
            .execute()
        appointments = appointments_response.data
        patient = None
    else:  # admin
        patients = supabase.table('patients').select('*').execute().data
        appointments = supabase.table('appointments')\
            .select('id, patients(first_name), doctors(name, specialty), hospitals(name, city), date, time, reason, findings, is_completed').execute().data
        return render_template('admin_view.html', patients=patients, appointments=appointments)

    if current_user.role != 'admin' and not patient and not appointments:
        return "Data not found", 404
    return render_template('health_record.html', patient=patient, appointments=appointments)

# Registracija korisnika
@app.route('/register', methods=['GET', 'POST'])
def add_patient():
    if request.method == 'POST':
        # Pronalazimo maksimalni ID u tabeli patients i dodajemo 1
        max_id_response = supabase.table('patients').select('id').order('id', desc=True).limit(1).execute()
        new_id = 1 if not max_id_response.data else max_id_response.data[0]['id'] + 1

        first_name = request.form['first_name']
        last_name = request.form['last_name']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        dob = request.form['dob']
        gender = request.form['gender']
        blood_type = request.form['blood_type']
        allergies = request.form['allergies']
        medical_conditions = request.form['medical_conditions']

        # Validate required fields and password confirmation
        if not all([first_name, last_name, email, password, confirm_password, dob, gender]):
            flash('All required fields must be filled')
            return redirect(url_for('register'))
        if password != confirm_password:
            flash('Passwords do not match')
            return redirect(url_for('register'))

        data = {
            'id': new_id,
            'first_name': first_name,
            'last_name': last_name,
            'dob': dob,
            'gender': gender,
            'blood_type': blood_type,
            'allergies': allergies,
            'medical_conditions': medical_conditions,
            'email': email,
            'password': password
        }
        supabase.table('patients').insert(data).execute()
        return redirect(url_for('health_record'))

    return render_template('register.html')
# Dodavanje termina (samo doktor ili admin)
@app.route('/add-appointment/<int:patient_id>', methods=['GET', 'POST'])
@login_required
def add_appointment(patient_id):
    
    if request.method == 'POST':
        data = {
            'patient_id': patient_id,
            'doctor_id': int(request.form['doctor_id']),
            'hospital_id': int(request.form['hospital_id']),
            'date': request.form['date'],
            'time': request.form['time'],
            'reason': request.form['reason']
        }
        supabase.table('appointments').insert(data).execute()
        return redirect(url_for('health_record'))
    doctors = supabase.table('doctors').select('id, name, specialty').execute().data
    hospitals = supabase.table('hospitals').select('id, name, city').execute().data
    return render_template('add_appointment.html', patient_id=patient_id, doctors=doctors, hospitals=hospitals)

# Nova ruta za unos nalaza i označavanje pregleda kao završenog
@app.route('/add-findings/<int:appointment_id>', methods=['GET', 'POST'])
@login_required
def add_findings(appointment_id):
    if current_user.role != 'doctor':
        return "Access denied", 403
    
    if request.method == 'POST':
        findings = request.form['findings']
        # Ažuriramo appointment sa nalazima i označavamo kao završen
        supabase.table('appointments')\
            .update({'findings': findings, 'is_completed': True})\
            .eq('id', appointment_id)\
            .execute()
        return redirect(url_for('health_record'))
    
    # Pronalazimo appointment za prikaz informacija
    appointment_response = supabase.table('appointments')\
        .select('id, patients(first_name), date, time, reason, hospitals(name, city)')\
        .eq('id', appointment_id)\
        .execute()
    if not appointment_response.data:
        return "Appointment not found", 404
    appointment = appointment_response.data[0]
    return render_template('add_findings.html', appointment=appointment)

if __name__ == '__main__':
    app.run(debug=True)



