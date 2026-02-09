"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export default function AuthDemo() {
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await authClient.signUp.email({
          email,
          password,
          name,
          callbackURL: "/",
        });
      } else {
        await authClient.signIn.email({
          email,
          password,
          callbackURL: "/",
        });
      }
    } catch (err) {
      console.error(err);
      alert("Error during authentication");
    }
  };

  if (isPending) return <div>Loading session...</div>;

  console.log("session", session);

  if (session) {
    return (
      <div className="p-4 border rounded shadow-md bg-white dark:bg-zinc-800">
        <p className="mb-2">
          Signed in as <strong>{session.user.email}</strong> (
          {session.user.name})
        </p>
        <button
          onClick={() => authClient.signOut()}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg shadow-md bg-white dark:bg-zinc-800 max-w-sm mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">
        {isSignUp ? "Create Account" : "Welcome Back"}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isSignUp && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded text-black bg-gray-50 dark:bg-zinc-100"
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded text-black bg-gray-50 dark:bg-zinc-100"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded text-black bg-gray-50 dark:bg-zinc-100"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-semibold transition"
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </button>
      </form>
      <div className="mt-4 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-blue-500 hover:underline"
        >
          {isSignUp
            ? "Already have an account? Sign In"
            : "Need an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
