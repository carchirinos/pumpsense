# PumpSense — Product Definition

## Overview

**PumpSense** is an AI-powered diagnostic agent that helps industrial maintenance technicians quickly diagnose pump failures in real-time. Technicians describe symptoms they observe (e.g., "the pump is vibrating hard and lost pressure"), and the agent provides a likely cause and recommended action using AI reasoning.

## Target User

**Maintenance technicians** working with industrial pumps in manufacturing plants, water treatment facilities, HVAC systems, and other industrial environments. These users:
- Are hands-on operators, not engineers or data scientists
- Need fast, actionable guidance while on the factory floor
- May be accessing the tool on tablets or mobile devices
- Value clear, confident recommendations over uncertainty

## Core Value Proposition

- **Speed**: Get a diagnosis in seconds, not hours of manual troubleshooting
- **Accuracy**: AI reasoning grounded in common industrial pump failure patterns
- **Actionability**: Every diagnosis includes a recommended next step
- **Accessibility**: No login required, works on any device with a browser

## User Flow

1. **Landing page**: Technician arrives and sees:
   - Product introduction with real industrial photography
   - Example failure categories (cavitation, bearing failure, seal leaks, etc.)
   - Testimonials from maintenance teams
   - Clear call-to-action: "Diagnose a Pump Issue"

2. **Chat interface**: Technician describes the symptom in natural language
   - Examples: "pump making grinding noise", "low flow and high temperature", "vibration increased after restart"

3. **Diagnostic result**: Agent returns a structured card with:
   - **Symptom summary**: What the technician reported
   - **Likely cause**: Root cause diagnosis
   - **Recommended action**: Step-by-step guidance for the technician
   - **Confidence level**: High / Medium / Low

## Visual Style

- **Enterprise-grade, not chatbot-like**: Clean, professional, trustworthy
- **Real photography**: Use Unsplash/Pexels images showing real industrial pumps, technicians at work, manufacturing environments
- **No generic AI aesthetics**: Avoid gradient backgrounds, floating particles, or abstract illustrations
- **Structured information display**: Diagnostic cards should feel like work orders or inspection reports, not chat bubbles

## MVP Scope (This Version)

✅ **In scope**:
- Landing page with product intro, example failures, testimonials
- Chat interface for symptom input and diagnosis display
- AWS Lambda + API Gateway backend
- Amazon Bedrock integration (us.anthropic.claude-sonnet-4-6)
- Hardcoded knowledge base (symptom → cause → action patterns)
- Live AWS deployment (judges will test it)
- Responsive design (mobile and desktop)

❌ **Explicitly out of scope** (roadmap features, not built in MVP):
- OpenSearch Serverless RAG for knowledge retrieval
- User authentication / login
- DynamoDB conversation persistence
- WhatsApp integration
- Multi-language support
- Admin dashboard for failure pattern management

## Success Criteria

A successful MVP will:
- Load quickly and work reliably on mobile and desktop browsers
- Accept natural language symptom descriptions
- Return plausible, structured diagnoses with confidence levels
- Look and feel like an enterprise tool, not a demo
- Be deployed live on AWS and publicly accessible
