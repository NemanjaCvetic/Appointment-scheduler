// This file handles the appointment booking and confirmation functionality

function bookAppointment(form) {
    // Get appointment details
    const bookingForm = document.getElementById('booking-form');
    const doctorId = bookingForm.dataset.doctorId;
    const doctorName = bookingForm.dataset.doctorName;
    const date = bookingForm.dataset.date;
    const time = bookingForm.dataset.time;
    
    // Get form data
    const formData = {
        doctorId: doctorId,
        date: date,
        time: time,
        patientName: form.name.value,
        patientEmail: form.email.value,
        patientPhone: form.phone.value,
        notes: form.notes.value
    };
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Booking...';
    submitButton.disabled = true;
    
    // Send booking request to the server
    fetch('/api/book_appointment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to book appointment');
        }
        return response.json();
    })
    .then(data => {
        // Reset form
        form.reset();
        
        // Hide booking form
        bookingForm.classList.add('hidden');
        
        // Show confirmation modal
        showConfirmationModal(doctorName, date, time, formData.patientName);
    })
    .catch(error => {
        alert(`Error booking appointment: ${error.message}`);
    })
    .finally(() => {
        // Reset button state
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    });
}

function showConfirmationModal(doctorName, date, time, patientName) {
    const modal = document.getElementById('confirmation-modal');
    const appointmentDetails = document.getElementById('appointment-details');
    
    // Format the appointment details
    appointmentDetails.innerHTML = `
        <p><strong>Doctor:</strong> ${doctorName}</p>
        <p><strong>Date:</strong> ${formatDate(date)}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Patient:</strong> ${patientName}</p>
        <p>A confirmation email has been sent to your email address.</p>
    `;
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Set up close button
    document.getElementById('close-modal').addEventListener('click', function() {
        modal.classList.add('hidden');
    });
}

// Create sample data for centers.json in the data directory
function createSampleData() {
    // This function would be used in a real application to create sample data
    // For demo purposes, we've included sample data in the app.py file
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Set up modal close on background click
    const modal = document.getElementById('confirmation-modal');
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});