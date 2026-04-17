import streamlit as st
import PyPDF2
# import google.generativeai as genai # We'll plug this in once you have an API key

# --- CONFIGURATION & UI SETUP ---
st.set_page_config(page_title="Hustle Tracker", layout="wide")
st.title("🚀 The Student Hustle Dashboard")

# Simple "Database" simulation using session_state (resets on refresh for now)
if 'user_data' not in st.session_state:
    st.session_state.user_data = {"name": "", "score": 0, "apps": 0}

# --- SIDEBAR: ONBOARDING ---
with st.sidebar:
    st.header("1. Onboarding")
    name = st.text_input("What's your name?")
    uploaded_file = st.file_uploader("Upload your Resume (PDF)", type="pdf")
    
    if st.button("Complete Onboarding"):
        if uploaded_file and name:
            # Step 1: Read the PDF
            reader = PyPDF2.PdfReader(uploaded_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
            
            # Step 2: "Hustle" Logic (Basic for now, AI later)
            # Let's say every 100 words in a resume is 10 'hustle points'
            word_count = len(text.split())
            st.session_state.user_data["score"] = min(100, int(word_count / 5))
            st.session_state.user_data["name"] = name
            st.success("Onboarded!")
        else:
            st.warning("Please enter a name and upload a file.")

# --- MAIN DASHBOARD ---
if st.session_state.user_data["name"]:
    st.subheader(f"Welcome back, {st.session_state.user_data['name']}!")
    
    # Category Scoring
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Resume Strength", f"{st.session_state.user_data['score']}/100")
        
    with col2:
        # User can manually increase their "hustle"
        if st.button("Log a Job Application"):
            st.session_state.user_data["apps"] += 1
        st.metric("Applications Sent", st.session_state.user_data["apps"])

    with col3:
        # A quick "AI Advice" placeholder
        st.metric("Networking Score", "15", delta="+2")

    st.divider()
    st.write("### Hustle Feed")
    st.info("Tip: You're currently in the top 20% of applicants this week. Keep it up!")

else:
    st.info("Please use the sidebar to onboard and see your score.")