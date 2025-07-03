import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Film, Mail } from "lucide-react";
import { api } from "@/lib/utils";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      setMessage(
        "If an account with that email exists, a reset link has been sent."
      );
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <Link to='/' className='inline-flex items-center space-x-2'>
            <Film className='h-10 w-10 text-red-500' />
            <span className='text-2xl font-bold text-white'>MovieFlix</span>
          </Link>
        </div>
        <Card className='bg-gray-800 border-gray-700'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl text-center text-white'>
              Forgot Password
            </CardTitle>
            <CardDescription className='text-center text-gray-400'>
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email' className='text-white'>
                  Email
                </Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    id='email'
                    type='email'
                    placeholder='Enter your email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    required
                  />
                </div>
              </div>
              <Button
                type='submit'
                className='w-full bg-red-600 hover:bg-red-700'
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
            {message && (
              <p className='mt-4 text-green-400 text-center'>{message}</p>
            )}
            {error && <p className='mt-4 text-red-400 text-center'>{error}</p>}
            <div className='mt-6 text-center'>
              <Link
                to='/login'
                className='text-red-500 hover:text-red-400 font-medium'
              >
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
