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
                    @if(session('success'))
                        <div class="alert alert-success">
                            {{ session('success') }}
                        </div>
                        <div id="payment-status" data-transaction-id="{{ session('transaction_id') }}" class="alert alert-info">
                            Checking payment status... <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        </div>
                    @endif

                    @if($errors->any())
                        <div class="alert alert-danger">
                            <ul class="mb-0">
                                @foreach($errors->all() as $error)
                                    <li>{{ $error }}</li>
                                @endforeach
                            </ul>
                        </div>
                    @endif

                    <div class="row mb-4">
                        <div class="col-md-12 text-center">
                            <img src="{{ asset('daraja-tutorial/images/1200px-M-PESA_LOGO-01.svg.png') }}"
                                 alt="M-Pesa Logo" class="img-fluid"
                                 style="max-height: 100px;">
                        </div>
                    </div>

                    <form action="{{ route('mpesa.stk-push') }}" method="POST" id="payment-form">
                        @csrf
                        <div class="mb-3">
                            <label for="phone" class="form-label">Phone Number (Format: 254XXXXXXXXX)</label>
                            <input type="text" class="form-control" id="phone" name="phone"
                                   placeholder="254XXXXXXXXX" value="{{ old('phone') }}" required>
                            <div class="form-text">Enter your phone number in the format 254XXXXXXXXX</div>
                        </div>

                        <div class="mb-3">
                            <label for="amount" class="form-label">Amount (KES)</label>
                            <input type="number" class="form-control" id="amount" name="amount"
                                   placeholder="Enter amount" min="1" value="{{ old('amount', 1) }}" required>
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
        const paymentStatus = document.getElementById('payment-status');

        if (paymentStatus) {
            const transactionId = paymentStatus.dataset.transactionId;

            // Check payment status every 5 seconds
            const statusCheck = setInterval(function() {
                fetch(`/mpesa/status/${transactionId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'completed') {
                            paymentStatus.classList.remove('alert-info');
                            paymentStatus.classList.add('alert-success');
                            paymentStatus.innerHTML = '<strong>Payment Successful!</strong> Your transaction has been completed.';
                            clearInterval(statusCheck);
                        } else if (data.status === 'failed') {
                            paymentStatus.classList.remove('alert-info');
                            paymentStatus.classList.add('alert-danger');
                            paymentStatus.innerHTML = '<strong>Payment Failed!</strong> ' + data.message;
                            clearInterval(statusCheck);
                        }
                    })
                    .catch(error => {
                        console.error('Error checking payment status:', error);
                    });
            }, 5000);

            // Stop checking after 2 minutes (typical M-Pesa timeout)
            setTimeout(function() {
                clearInterval(statusCheck);
                if (paymentStatus.classList.contains('alert-info')) {
                    paymentStatus.classList.remove('alert-info');
                    paymentStatus.classList.add('alert-warning');
                    paymentStatus.innerHTML = '<strong>Payment Status Unknown</strong> Please check your phone or M-Pesa messages for confirmation.';
                }
            }, 120000);
        }

        // Disable form on submit to prevent multiple submissions
        const form = document.getElementById('payment-form');
        const submitButton = document.getElementById('submit-button');

        if (form) {
            form.addEventListener('submit', function() {
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
                submitButton.disabled = true;
            });
        }
    });
</script>
@endpush
