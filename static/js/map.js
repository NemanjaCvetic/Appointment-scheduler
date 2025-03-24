document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map centered on Slovenia
    const map = L.map('slovenia-map').setView([46.1512, 14.9955], 8);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Fetch medical centers data
    fetch('/api/centers')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch medical centers');
            }
            return response.json();
        })
        .then(centers => {
            displayMedicalCenters(centers, map);
        })
        .catch(error => {
            console.error('Error fetching medical centers:', error);
            document.getElementById('center-details').innerHTML = 
                `<div class="error-message">Error loading medical centers: ${error.message}</div>`;
        });
});

function displayMedicalCenters(centers, map) {
    const centerDetails = document.getElementById('center-details');
    centerDetails.innerHTML = '<div class="card-list"></div>';
    const centersList = centerDetails.querySelector('.card-list');
    
    // Add markers to the map for each medical center
    centers.forEach(center => {
        // Create marker
        const marker = L.marker([center.lat, center.lng])
            .addTo(map)
            .bindPopup(`<strong>${center.name}</strong><br>${center.address}`);
        
        // Add click event to marker
        marker.on('click', function() {
            selectMedicalCenter(center);
            this.openPopup();
        });
        
        // Create card for the center
        const centerCard = document.createElement('div');
        centerCard.className = 'card';
        centerCard.innerHTML = `
            <h4>${center.name}</h4>
            <p>${center.address}</p>
        `;
        centerCard.addEventListener('click', () => {
            // Pan to center and open popup
            map.setView([center.lat, center.lng], 12);
            marker.openPopup();
            selectMedicalCenter(center);
        });
        
        centersList.appendChild(centerCard);
    });
}

function selectMedicalCenter(center) {
    // Update UI to show the selected center
    const centerInfo = document.getElementById('center-info');
    centerInfo.innerHTML = `
        <h3>${center.name}</h3>
        <p><strong>Address:</strong> ${center.address}</p>
        <div id="center-details"></div>
    `;
    
    // Fetch departments for this center
    fetchDepartments(center.id);
}

function fetchDepartments(centerId) {
    // Show departments panel and hide others
    document.getElementById('department-list').classList.remove('hidden');
    document.getElementById('doctor-list').classList.add('hidden');
    document.getElementById('schedule-view').classList.add('hidden');
    
    const departmentDetails = document.getElementById('department-details');
    departmentDetails.innerHTML = '<p>Loading departments...</p>';
    
    // For this demo, we'll create mock departments
    // In a real application, you would make an API call
    const mockDepartments = [
        { id: 1, name: "General Medicine", description: "Primary care services" },
        { id: 2, name: "Pediatrics", description: "Medical care for children and adolescents" },
        { id: 3, name: "Cardiology", description: "Heart and cardiovascular system specialists" },
        { id: 4, name: "Orthopedics", description: "Bone and joint specialists" },
        { id: 5, name: "Dermatology", description: "Skin, hair, and nail specialists" }
    ];
    
    setTimeout(() => {
        displayDepartments(mockDepartments);
    }, 300); // Simulate network delay
}

function displayDepartments(departments) {
    const departmentDetails = document.getElementById('department-details');
    
    if (departments.length === 0) {
        departmentDetails.innerHTML = '<p>No departments available at this center.</p>';
        return;
    }
    
    // Create back button
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.innerHTML = '← Back to Centers';
    backButton.addEventListener('click', () => {
        document.getElementById('department-list').classList.add('hidden');
    });
    
    departmentDetails.innerHTML = '';
    departmentDetails.appendChild(backButton);
    
    // Create departments list
    const departmentsList = document.createElement('div');
    departmentsList.className = 'card-list';
    
    departments.forEach(department => {
        const departmentCard = document.createElement('div');
        departmentCard.className = 'card';
        departmentCard.innerHTML = `
            <h4>${department.name}</h4>
            <p>${department.description}</p>
        `;
        departmentCard.addEventListener('click', () => {
            selectDepartment(department);
        });
        
        departmentsList.appendChild(departmentCard);
    });
    
    departmentDetails.appendChild(departmentsList);
}

function selectDepartment(department) {
    // Fetch doctors for this department
    fetchDoctors(department.id, department.name);
}

function fetchDoctors(departmentId, departmentName) {
    // Show doctor panel and hide schedule
    document.getElementById('doctor-list').classList.remove('hidden');
    document.getElementById('schedule-view').classList.add('hidden');
    
    const doctorDetails = document.getElementById('doctor-details');
    doctorDetails.innerHTML = '<p>Loading doctors...</p>';
    
    // For this demo, we'll create mock doctors
    // In a real application, you would make an API call
    const mockDoctors = [
        { id: 101, name: "Dr. Ana Novak", specialization: "Senior Specialist", image: "https://via.placeholder.com/60" },
        { id: 102, name: "Dr. Marko Kovač", specialization: "Consultant", image: "https://via.placeholder.com/60" },
        { id: 103, name: "Dr. Nina Horvat", specialization: "Resident", image: "https://via.placeholder.com/60" }
    ];
    
    setTimeout(() => {
        displayDoctors(mockDoctors, departmentName);
    }, 300); // Simulate network delay
}

function displayDoctors(doctors, departmentName) {
    const doctorDetails = document.getElementById('doctor-details');
    
    if (doctors.length === 0) {
        doctorDetails.innerHTML = '<p>No doctors available in this department.</p>';
        return;
    }
    
    // Create back button
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.innerHTML = '← Back to Departments';
    backButton.addEventListener('click', () => {
        document.getElementById('doctor-list').classList.add('hidden');
    });
    
    doctorDetails.innerHTML = '';
    doctorDetails.appendChild(backButton);
    
    // Add department name
    const heading = document.createElement('h4');
    heading.textContent = departmentName;
    doctorDetails.appendChild(heading);
    
    // Create doctors list
    const doctorsList = document.createElement('div');
    doctorsList.className = 'card-list';
    
    doctors.forEach(doctor => {
        const doctorCard = document.createElement('div');
        doctorCard.className = 'card';
        doctorCard.innerHTML = `
            <h4>${doctor.name}</h4>
            <p>${doctor.specialization}</p>
        `;
        doctorCard.addEventListener('click', () => {
            selectDoctor(doctor);
        });
        
        doctorsList.appendChild(doctorCard);
    });
    
    doctorDetails.appendChild(doctorsList);
}

function selectDoctor(doctor) {
    // Fetch schedule for this doctor
    fetchSchedule(doctor.id, doctor.name);
}

function fetchSchedule(doctorId, doctorName) {
    // Show schedule panel
    document.getElementById('schedule-view').classList.remove('hidden');
    
    const scheduleDetails = document.getElementById('schedule-details');
    scheduleDetails.innerHTML = '<p>Loading schedule...</p>';
    
    // For this demo, we'll create a mock schedule
    // In a real application, you would make an API call
    const today = new Date();
    const mockSchedule = {
        doctor: doctorName,
        dates: [
            {
                date: new Date(today.setDate(today.getDate() + 1)).toISOString().split('T')[0],
                slots: [
                    { time: "09:00", available: true },
                    { time: "10:00", available: true },
                    { time: "11:00", available: false },
                    { time: "13:00", available: true },
                    { time: "14:00", available: true }
                ]
            },
            {
                date: new Date(today.setDate(today.getDate() + 1)).toISOString().split('T')[0],
                slots: [
                    { time: "09:00", available: false },
                    { time: "10:00", available: false },
                    { time: "11:00", available: true },
                    { time: "13:00", available: true },
                    { time: "14:00", available: false }
                ]
            },
            {
                date: new Date(today.setDate(today.getDate() + 1)).toISOString().split('T')[0],
                slots: [
                    { time: "09:00", available: true },
                    { time: "10:00", available: true },
                    { time: "11:00", available: true },
                    { time: "13:00", available: false },
                    { time: "14:00", available: true }
                ]
            }
        ]
    };
    
    setTimeout(() => {
        displaySchedule(mockSchedule, doctorId);
    }, 300); // Simulate network delay
}

function displaySchedule(schedule, doctorId) {
    const scheduleDetails = document.getElementById('schedule-details');
    
    // Create back button
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.innerHTML = '← Back to Doctors';
    backButton.addEventListener('click', () => {
        document.getElementById('schedule-view').classList.add('hidden');
        document.getElementById('booking-form').classList.add('hidden');
    });
    
    scheduleDetails.innerHTML = '';
    scheduleDetails.appendChild(backButton);
    
    // Add doctor name
    const heading = document.createElement('h4');
    heading.textContent = schedule.doctor;
    scheduleDetails.appendChild(heading);
    
    // Create schedule for each date
    schedule.dates.forEach(dateSchedule => {
        const dateHeading = document.createElement('h5');
        dateHeading.textContent = formatDate(dateSchedule.date);
        scheduleDetails.appendChild(dateHeading);
        
        const timeSlots = document.createElement('div');
        timeSlots.className = 'time-slots';
        
        dateSchedule.slots.forEach(slot => {
            const timeSlot = document.createElement('div');
            timeSlot.className = slot.available ? 'time-slot' : 'time-slot unavailable';
            timeSlot.textContent = slot.time;
            
            if (slot.available) {
                timeSlot.addEventListener('click', () => {
                    // Remove selected class from any previously selected slots
                    document.querySelectorAll('.time-slot.selected').forEach(el => {
                        el.classList.remove('selected');
                    });
                    
                    // Add selected class to this slot
                    timeSlot.classList.add('selected');
                    
                    // Show booking form
                    showBookingForm(doctorId, schedule.doctor, dateSchedule.date, slot.time);
                });
            }
            
            timeSlots.appendChild(timeSlot);
        });
        
        scheduleDetails.appendChild(timeSlots);
    });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function showBookingForm(doctorId, doctorName, date, time) {
    const bookingForm = document.getElementById('booking-form');
    bookingForm.classList.remove('hidden');
    
    // Store appointment details
    bookingForm.dataset.doctorId = doctorId;
    bookingForm.dataset.doctorName = doctorName;
    bookingForm.dataset.date = date;
    bookingForm.dataset.time = time;
    
    // Update heading
    bookingForm.querySelector('h4').textContent = `Book Appointment: ${formatDate(date)} at ${time}`;
    
    // Set up form submission
    document.getElementById('appointment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        bookAppointment(this);
    });
}