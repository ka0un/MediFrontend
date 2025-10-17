
import React, { useState } from 'react';
import type { AuthUser } from '../types';
import { Card, Button, Input } from './ui';
import { HealthCardIcon } from './Icons';
import { validatePhoneNumber, validateAddress, validateEmail, validateRequired } from '../utils/validation';
import { generateHealthCardNumber } from '../utils/healthCardGenerator';

type AuthProps = {
    onLogin: (credentials: {username: string, password: string}) => Promise<AuthUser>;
    onRegister: (data: any) => Promise<AuthUser>;
    addNotification: (type: 'success' | 'error', message: string) => void;
};

export default function Auth({ onLogin, onRegister, addNotification }: AuthProps) {
    const [isRegister, setIsRegister] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [generatedHealthCard, setGeneratedHealthCard] = useState<string>('');

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const credentials = {
            username: formData.get('username') as string,
            password: formData.get('password') as string,
        };
        try {
            await onLogin(credentials);
            // Successful login is handled by the App component state change
        } catch (error) {
            addNotification('error', error instanceof Error ? error.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Generate health card number when switching to registration
    const handleRegisterMode = () => {
        setIsRegister(true);
        setGeneratedHealthCard(generateHealthCardNumber());
        setErrors({});
    };

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        
        if (formData.get('password') !== formData.get('confirmPassword')) {
            addNotification('error', 'Passwords do not match.');
            setIsLoading(false);
            return;
        }

        // Validate form fields
        const newErrors: Record<string, string> = {};
        
        const phone = formData.get('phone') as string;
        const phoneValidation = validatePhoneNumber(phone);
        if (!phoneValidation.isValid) {
            newErrors.phone = phoneValidation.message || '';
        }
        
        const email = formData.get('email') as string;
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            newErrors.email = emailValidation.message || '';
        }
        
        const name = formData.get('name') as string;
        const nameValidation = validateRequired(name, 'Full Name');
        if (!nameValidation.isValid) {
            newErrors.name = nameValidation.message || '';
        }
        
        const username = formData.get('username') as string;
        const usernameValidation = validateRequired(username, 'Username');
        if (!usernameValidation.isValid) {
            newErrors.username = usernameValidation.message || '';
        }
        
        const address = formData.get('address') as string;
        if (address) {
            const addressValidation = validateAddress(address);
            if (!addressValidation.isValid) {
                newErrors.address = addressValidation.message || '';
            }
        }
        
        setErrors(newErrors);
        
        if (Object.keys(newErrors).length > 0) {
            addNotification('error', 'Please fix the validation errors before submitting.');
            setIsLoading(false);
            return;
        }

        const data = Object.fromEntries(formData.entries());
        delete data.confirmPassword;
        // Use the generated health card number
        data.digitalHealthCardNumber = generatedHealthCard;

        try {
            await onRegister(data);
            // Successful registration is handled by the App component state change
        } catch(error) {
            addNotification('error', error instanceof Error ? error.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
            <div className="flex items-center mb-8">
                <HealthCardIcon className="h-12 w-12 text-primary"/>
                <h1 className="text-5xl font-bold ml-4 text-slate-800">MediSystem</h1>
            </div>
            <Card className="w-full max-w-md">
                <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setIsRegister(false)} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${!isRegister ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            Sign In
                        </button>
                        <button onClick={handleRegisterMode} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${isRegister ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            Create Account
                        </button>
                    </nav>
                </div>
                
                {isRegister ? (
                    <form onSubmit={handleRegister} className="space-y-4">
                         <h2 className="text-xl font-bold text-slate-700">Register as a new Patient</h2>
                        <Input name="username" label="Username" required error={errors.username} />
                        <Input name="password" label="Password" type="password" required />
                        <Input name="confirmPassword" label="Confirm Password" type="password" required />
                        <hr className="my-2"/>
                        <Input name="name" label="Full Name" required error={errors.name} />
                        <Input name="email" label="Email" type="email" required error={errors.email} />
                        <Input 
                            name="phone" 
                            label="Phone" 
                            required 
                            error={errors.phone}
                            helperText="Enter 10-digit phone number (e.g., 1234567890)"
                        />
                        <Input 
                            name="digitalHealthCardNumber" 
                            label="Digital Health Card Number" 
                            value={generatedHealthCard}
                            disabled
                            helperText="Auto-generated unique health card number"
                        />
                        <Input 
                            name="address" 
                            label="Address" 
                            error={errors.address}
                            helperText="Enter full address (optional)"
                        />
                        <Input name="dateOfBirth" label="Date of Birth" type="date" />
                        <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Registering...' : 'Register'}</Button>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-700">Sign in to your account</h2>
                        <Input name="username" label="Username" required defaultValue="admin" />
                        <Input name="password" label="Password" type="password" required defaultValue="admin" />
                        <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Signing In...' : 'Sign In'}</Button>
                    </form>
                )}
            </Card>
        </div>
    );
}
