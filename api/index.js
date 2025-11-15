/**
 * Vercel Serverless Function for Reclaim AI Agent
 * This allows deployment to Vercel
 */

const express = require('express');
const cors = require('cors');

// Note: For Vercel, we need to use CommonJS and handle imports differently
// This is a fallback option - Railway/Docker is preferred for Express apps

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    return res.json({ status: 'ok', service: 'reclaim-ai-agent' });
  }

  // For now, redirect to Railway/Render deployment
  // Vercel is better for Next.js, not Express standalone apps
  return res.json({
    message: 'Please use Railway, Render, or Docker for Express server deployment',
    alternatives: ['railway.app', 'render.com', 'fly.io'],
  });
};

