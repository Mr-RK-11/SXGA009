import React, { useState } from 'react';
import axios from 'axios';
import { X, Calendar, CheckCircle, User } from '@phosphor-icons/react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TIME_SLOTS = ['10:00 AM', '12:00 PM', '3:00 PM'];

export default function ConsultationModal({ documentId, lawyer, onClose }) {
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    preferred_date: '',
    preferred_time: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/consultation/book`, {
        document_id: documentId,
        ...formData
      });
      
      // Store appointment details for confirmation display
      setAppointmentDetails({
        lawyer_name: response.data.appointment?.lawyer_name || lawyer?.name || 'Unknown',
        lawyer_title: response.data.appointment?.lawyer_title || lawyer?.title || 'Lawyer',
        date: formData.preferred_date,
        time: formData.preferred_time
      });
      
      // Open WhatsApp link in new tab
      if (response.data.whatsapp_link) {
        window.open(response.data.whatsapp_link, '_blank');
      }
      
      setSuccess(true);
      
      setTimeout(() => {
        onClose();
      }, 5000);
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to generate WhatsApp link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Book Lawyer Consultation
            </h2>
            {lawyer && (
              <div className="flex items-center gap-3 bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                <User size={24} weight="fill" className="text-[#2563EB]" />
                <div>
                  <p className="text-sm text-gray-600">Booking with:</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {lawyer.name} <span className="text-base text-gray-600">({lawyer.title})</span>
                  </p>
                </div>
              </div>
            )}
          </div>
          <button
            data-testid="consultation-close-button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} weight="bold" className="text-gray-600" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle size={48} weight="fill" className="text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Appointment Confirmed
            </h3>
            
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
              <p className="text-base text-green-800 font-medium text-center">
                📱 Redirecting to WhatsApp to confirm your appointment...
              </p>
            </div>
            
            {appointmentDetails && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-left max-w-md mx-auto">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Lawyer</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {appointmentDetails.lawyer_name}
                    </p>
                    <p className="text-sm text-gray-600">{appointmentDetails.lawyer_title}</p>
                  </div>
                  
                  <div className="border-t border-blue-200 pt-3">
                    <p className="text-sm text-gray-600 mb-1">Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(appointmentDetails.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  
                  <div className="border-t border-blue-200 pt-3">
                    <p className="text-sm text-gray-600 mb-1">Time</p>
                    <p className="text-lg font-semibold text-gray-900">{appointmentDetails.time}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Your Name *
              </label>
              <input
                type="text"
                data-testid="consultation-name-input"
                value={formData.user_name}
                onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                className="bg-gray-50 border-2 border-gray-200 text-gray-900 text-base rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-blue-200 focus:outline-none p-4 w-full transition-all duration-200"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Email Address *
              </label>
              <input
                type="email"
                data-testid="consultation-email-input"
                value={formData.user_email}
                onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                className="bg-gray-50 border-2 border-gray-200 text-gray-900 text-base rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-blue-200 focus:outline-none p-4 w-full transition-all duration-200"
                placeholder="john.doe@example.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Preferred Date *
              </label>
              <input
                type="date"
                data-testid="consultation-date-input"
                value={formData.preferred_date}
                onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                min={today}
                className="bg-gray-50 border-2 border-gray-200 text-gray-900 text-base rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-blue-200 focus:outline-none p-4 w-full transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-3">
                Preferred Time Slot *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    data-testid={`consultation-time-${slot.replace(/[: ]/g, '-')}`}
                    onClick={() => setFormData({ ...formData, preferred_time: slot })}
                    className={`py-4 px-4 rounded-xl border-2 font-semibold text-sm transition-all duration-200 transform hover:scale-105 ${
                      formData.preferred_time === slot
                        ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-lg'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#2563EB]'
                    }`}
                  >
                    <Calendar size={20} weight="bold" className="mx-auto mb-1" />
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Additional Message (Optional)
              </label>
              <textarea
                data-testid="consultation-message-input"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="bg-gray-50 border-2 border-gray-200 text-gray-900 text-base rounded-xl focus:border-[#2563EB] focus:ring-2 focus:ring-blue-200 focus:outline-none p-4 w-full transition-all duration-200 resize-none"
                placeholder="Any specific concerns or questions you'd like to discuss..."
                rows={4}
              />
            </div>

            <button
              type="submit"
              data-testid="consultation-submit-button"
              disabled={loading || !formData.user_name || !formData.user_email || !formData.preferred_date || !formData.preferred_time}
              className="bg-[#2563EB] text-white font-semibold text-lg px-8 py-4 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none transition-all duration-200 w-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-[1.02]"
            >
              {loading ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
