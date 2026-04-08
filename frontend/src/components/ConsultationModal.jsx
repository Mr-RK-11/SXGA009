import React, { useState } from 'react';
import axios from 'axios';
import { X, Calendar } from '@phosphor-icons/react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TIME_SLOTS = ['10 AM', '12 PM', '3 PM'];

export default function ConsultationModal({ documentId, onClose }) {
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    preferred_time: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/consultation/book`, {
        document_id: documentId,
        ...formData
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to book consultation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="bg-white border-2 border-gray-900 rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black">
            Book Lawyer Consultation
          </h2>
          <button
            data-testid="consultation-close-button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={24} weight="bold" className="text-gray-900" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="bg-green-100 text-green-800 border-2 border-green-200 rounded-md p-6 mb-4">
              <p className="text-lg font-semibold mb-2">Consultation Booked!</p>
              <p className="text-base">You will receive a confirmation email shortly.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-semibold tracking-[0.05em] uppercase text-gray-700 block mb-2">
                Your Name
              </label>
              <input
                type="text"
                data-testid="consultation-name-input"
                value={formData.user_name}
                onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                className="bg-white border-2 border-gray-300 text-gray-900 text-lg rounded-md focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC] focus:outline-none p-3 w-full"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold tracking-[0.05em] uppercase text-gray-700 block mb-2">
                Email Address
              </label>
              <input
                type="email"
                data-testid="consultation-email-input"
                value={formData.user_email}
                onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                className="bg-white border-2 border-gray-300 text-gray-900 text-lg rounded-md focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC] focus:outline-none p-3 w-full"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold tracking-[0.05em] uppercase text-gray-700 block mb-2">
                Preferred Time
              </label>
              <div className="grid grid-cols-3 gap-4">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    data-testid={`consultation-time-${slot.replace(' ', '-')}`}
                    onClick={() => setFormData({ ...formData, preferred_time: slot })}
                    className={`py-3 px-4 rounded-md border-2 font-semibold text-base transition-all ${
                      formData.preferred_time === slot
                        ? 'bg-[#0052CC] text-white border-[#0052CC]'
                        : 'bg-white text-gray-900 border-gray-300 hover:border-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Calendar size={20} weight="bold" className="inline mr-2" />
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              data-testid="consultation-submit-button"
              disabled={loading || !formData.user_name || !formData.user_email || !formData.preferred_time}
              className="bg-[#0052CC] text-white font-semibold text-lg px-6 py-3 rounded-md hover:bg-[#003D99] focus:ring-4 focus:ring-blue-300 focus:outline-none transition-all w-full disabled:opacity-50"
            >
              {loading ? 'Booking...' : 'Book Consultation'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}