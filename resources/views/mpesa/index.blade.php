@extends('layouts.app')

@section('content')
<div class="container py-4">
    <div class="row justify-content-center">
        <div class="col-md-6">
            <div class="card shadow">
                <div class="card-header bg-primary text-white">
                    <h4 class="mb-0">Make Payment with M-Pesa</h4>
                </div>
                <div class="card-body">
                    <div id="payment-alerts"></div>

                    <div class="row mb-4">
                        <div class="col-md-12 text-center">
                            <img src="{{ asset('daraja-tutorial/images/1200px-M-PESA_LOGO-01.svg.png') }}"
                                 alt="M-Pesa Logo" class="img-fluid"
                                 style="max-height: 100px;">
                        </div>
                    </div>

                    <div class="alert alert-info mb-4">
                        <h5 class="mb-2">{{ ucfirst(str_replace('_', ' ', $plan)) }}</h5>
                        <p class="mb-1"><strong>Amount:</strong> KES {{ number_format($amount) }}</p>
                        <p class="mb-0"><strong>AI Prompts:</strong> {{ number_format($promptCount) }}</p>
                    </div>

                    <form action="{{ route('mpesa.stk-push') }}" method="POST" id="payment-form">
                        @csrf
                        <div class="mb-3">
                            <label for="phone" class="form-label">Phone Number (Format: 254XXXXXXXXX)</label>
                            <input type="text" class="form-control" id="phone" name="phone"
                                   placeholder="254XXXXXXXXX" value="{{ old('phone') }}" required>
                            <div class="form-text">Enter your phone number in the format 254XXXXXXXXX</div>
                            <div class="invalid-feedback" id="phone-error"></div>
                        </div>

                        <div class="mb-3">
                            <label for="amount" class="form-label">Amount (KES)</label>
                            <input type="number" class="form-control" id="amount" name="amount"
                                   placeholder="Enter amount" min="1" value="{{ old('amount', $amount) }}" readonly>
                            <input type="hidden" name="plan" value="{{ $plan }}">
                            <input type="hidden" name="prompt_count" value="{{ $promptCount }}">
                        </div>

                        <div class="d-grid gap-2">
                            <button type="submit" class="btn btn-primary" id="submit-button">
                                Pay Now
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('payment-form');
        const submitButton = document.getElementById('submit-button');
        const alertsContainer = document.getElementById('payment-alerts');
        const phoneInput = document.getElementById('phone');
        const phoneError = document.getElementById('phone-error');

        function showAlert(message, type = 'danger') {
            alertsContainer.innerHTML = `
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
        }

        function startPaymentStatusCheck(checkoutRequestId) {
            const statusCheck = setInterval(function() {
                fetch(`/mpesa/status/${checkoutRequestId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'completed') {
                            showAlert('Payment successful! Your transaction has been completed.', 'success');
                            clearInterval(statusCheck);
                        } else if (data.status === 'failed') {
                            showAlert('Payment failed: ' + data.message);
                            clearInterval(statusCheck);
                            submitButton.disabled = false;
                            submitButton.innerHTML = 'Try Again';
                        }
                    })
                    .catch(error => {
                        console.error('Error checking payment status:', error);
                    });
            }, 5000);

            // Stop checking after 2 minutes
            setTimeout(function() {
                clearInterval(statusCheck);
                if (alertsContainer.querySelector('.alert-info')) {
                    showAlert('Payment status unknown. Please check your phone or M-Pesa messages for confirmation.', 'warning');
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Try Again';
                }
            }, 120000);
        }

        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();

                // Reset error states
                phoneInput.classList.remove('is-invalid');
                phoneError.textContent = '';
                alertsContainer.innerHTML = '';

                // Validate phone number format
                const phoneRegex = /^254[0-9]{9}$/;
                const phoneNumber = phoneInput.value;

                if (!phoneRegex.test(phoneNumber)) {
                    phoneInput.classList.add('is-invalid');
                    phoneError.textContent = 'Please enter a valid phone number in the format 254XXXXXXXXX';
                    return;
                }

                // Disable submit button and show loading state
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

                // Show processing alert
                showAlert('Processing your payment request...', 'info');

                // Get the form data
                const formData = new FormData(form);

                // Send the request
                fetch(form.action, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(Object.fromEntries(formData))
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showAlert('STK push sent successfully. Please check your phone for the payment prompt.', 'info');
                        startPaymentStatusCheck(data.data.CheckoutRequestID);
                    } else {
                        showAlert(data.error || 'Failed to process payment. Please try again.');
                        submitButton.disabled = false;
                        submitButton.innerHTML = 'Try Again';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showAlert('An error occurred. Please try again.');
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Try Again';
                });
            });
        }
    });
</script>
@endpush
