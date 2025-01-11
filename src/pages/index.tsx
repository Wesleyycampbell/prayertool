import { useState } from 'react';
import Head from 'next/head';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getSession, signIn, signOut, useSession } from 'next-auth/react';

const HomePage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', prayer: '' });
  const [message, setMessage] = useState('');
  const { data: session } = useSession();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setMessage('Please sign in to submit a prayer request.');
      return;
    }
    setMessage('Submitting your prayer request...');
    try {
      const res = await fetch('/api/prayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setMessage('Thank you! Your prayer request has been submitted.');
        setFormData({ name: '', email: '', prayer: '' });
      } else {
        setMessage('Something went wrong. Please try again.');
      }
    } catch (error) {
      setMessage('Error submitting prayer request. Please try later.');
    }
  };

  return (
    <div className="container mt-5">
      <Head>
        <title>Spiritual Cookie</title>
        <meta name="description" content="Submit your prayer requests" />
      </Head>
      <h1 className="text-center mb-4">Spiritual Cookie</h1>
      <p className="text-center">Share your prayer requests, and we will keep you in our prayers.</p>
      {!session ? (
        <div className="text-center mb-4">
          <button onClick={() => signIn()} className="btn btn-primary">Sign In to Submit</button>
        </div>
      ) : (
        <div className="text-center mb-4">
          <p>Signed in as {session.user?.email}</p>
          <button onClick={() => signOut()} className="btn btn-secondary">Sign Out</button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="needs-validation" noValidate>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email address</label>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="prayer" className="form-label">Prayer Request</label>
          <textarea
            className="form-control"
            id="prayer"
            name="prayer"
            rows={4}
            value={formData.prayer}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        <button type="submit" className="btn btn-primary" disabled={!session}>Submit</button>
      </form>
      {message && <p className="mt-3 text-center">{message}</p>}
    </div>
  );
};

export default HomePage;

// pages/about.tsx (About Page)
const AboutPage = () => (
  <div className="container mt-5">
    <h1>About Spiritual Cookie</h1>
    <p>This platform is dedicated to sharing and supporting prayer requests from our community.</p>
  </div>
);

export default AboutPage;

// Step 2: API route to handle prayer requests
// pages/api/prayer.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import { getSession } from 'next-auth/react';

const uri = process.env.MONGODB_URI || 'your-mongodb-uri';
const client = new MongoClient(uri);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
      await client.connect();
      const db = client.db('spiritual-cookie');
      const collection = db.collection('prayer-requests');

      const { name, email, prayer } = req.body;
      if (!name || !email || !prayer) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      await collection.insertOne({ name, email, prayer, date: new Date(), user: session.user?.email });
      res.status(200).json({ message: 'Prayer request submitted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' });
    } finally {
      await client.close();
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

export default handler;

// Step 3: Authentication setup (using Next-auth)
// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';

export default NextAuth({
  providers: [
    Providers.Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session(session, token) {
      session.user.id = token.sub;
      return session;
    },
  },
});
