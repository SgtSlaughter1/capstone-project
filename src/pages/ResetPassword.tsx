import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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
import { Film, Lock } from "lucide-react";
import { api } from "@/lib/utils";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }
    try {
      await api.post("/auth/reset-password", { email, token, newPassword });
      setMessage("Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password.");
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
              Reset Password
            </CardTitle>
            <CardDescription className='text-center text-gray-400'>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='newPassword' className='text-white'>
                  New Password
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    id='newPassword'
                    type='password'
                    placeholder='Enter new password'
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className='pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    required
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='confirmPassword' className='text-white'>
                  Confirm Password
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    id='confirmPassword'
                    type='password'
                    placeholder='Confirm new password'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                {isLoading ? "Resetting..." : "Reset Password"}
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

export default ResetPassword;
