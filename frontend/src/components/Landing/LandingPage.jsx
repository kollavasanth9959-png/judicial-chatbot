import React from 'react';

/**
 * PAGE 1 — LANDING PAGE WIREFRAME implementation
 * Adheres to strict Government UI constraints: High trust, authoritative, clean.
 */
export default function LandingPage({ onLogin }) {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            {/* 🟦 SECTION 1: HEADER (Sticky, White, Thin Border) */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Placeholder for DOJ Emblem */}
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                            alt="Government of India"
                            className="w-10 h-10 object-contain"
                        />
                        <div className="font-bold text-xl tracking-tight text-slate-800">
                            AI Judicial Chatbot
                        </div>
                    </div>
                    <button
                        onClick={onLogin}
                        className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-md font-semibold text-sm transition-colors"
                    >
                        Login
                    </button>
                </div>
            </header>

            {/* 🟦 SECTION 2: HERO SECTION */}
            <section className="bg-slate-50 py-20 border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                        AI Judicial Chatbot
                    </h1>
                    <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
                        Revolutionizing Legal Assistance Through AI
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={onLogin} className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-3 rounded-md font-bold text-lg shadow-sm transition-transform active:scale-95">
                            Ask a Legal Question
                        </button>
                        <button className="bg-white hover:bg-slate-100 text-blue-900 border border-blue-900 px-8 py-3 rounded-md font-bold text-lg shadow-sm">
                            Explore Services
                        </button>
                    </div>
                </div>
            </section>

            {/* 🟦 SECTION 3: KEY SERVICES (Card Grid) */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { title: "DOJ Divisions", img: "https://img.icons8.com/color/96/courthouse.png", link: "https://doj.gov.in/" },
                            { title: "Case Pendency (NJDG)", img: "https://img.icons8.com/color/96/combo-chart.png", link: "https://njdg.ecourts.gov.in/" },
                            { title: "E-Filing Guide", img: "https://img.icons8.com/color/96/document--v1.png", link: "https://efiling.ecourts.gov.in/" },
                            { title: "Traffic Fines", img: "https://img.icons8.com/color/96/traffic-jam.png", link: "https://echallan.parivahan.gov.in/" },
                            { title: "Fast-Track Courts", img: "https://img.icons8.com/color/96/scales.png", link: "https://doj.gov.in/fast-track-courts/" },
                            { title: "Tele-Law Access", img: "https://img.icons8.com/color/96/customer-support.png", link: "https://www.tele-law.in/" }
                        ].map((service, idx) => (
                            <a
                                key={idx}
                                href={service.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block border border-slate-200 p-6 rounded-lg hover:border-blue-700 hover:shadow-md cursor-pointer transition-all group bg-slate-50/50"
                            >
                                <div className="mb-4 group-hover:scale-110 transition-transform duration-300 origin-left">
                                    <img src={service.img} alt={service.title} className="w-12 h-12" />
                                </div>
                                <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-900 flex items-center gap-2">
                                    {service.title}
                                    <span className="text-slate-400 text-sm group-hover:translate-x-1 transition-transform">→</span>
                                </h3>
                                <p className="text-slate-500 text-sm mt-2">Access verified information instantly.</p>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* 🟦 SECTION 4: HOW IT WORKS (RAG FLOW) */}
            <section className="py-16 bg-slate-50 border-y border-slate-200">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-lg font-bold text-slate-700">
                        <div className="bg-white p-4 rounded shadow-sm border border-slate-200">Ask Question</div>
                        <div className="text-slate-400">→</div>
                        <div className="bg-white p-4 rounded shadow-sm border border-slate-200">AI Retrieves</div>
                        <div className="text-slate-400">→</div>
                        <div className="bg-green-50 text-green-800 p-4 rounded shadow-sm border border-green-200">Verified Answer</div>
                    </div>
                    <p className="mt-8 text-sm text-slate-500 italic max-w-xl mx-auto">
                        “Answers are generated only from verified judicial data sources.”
                    </p>
                </div>
            </section>

            {/* 🟦 SECTION 5: TRUST & SECURITY */}
            <section className="py-12 bg-blue-900 text-white">
                <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-8 text-center md:text-left">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold flex items-center gap-2 justify-center md:justify-start">
                            <span>🔒</span> Data Privacy
                        </h3>
                        <p className="text-blue-100">Your interaction data is encrypted and strictly confidential.</p>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold flex items-center gap-2 justify-center md:justify-start">
                            <span>⚖️</span> No Hallucination
                        </h3>
                        <p className="text-blue-100">System is strictly grounded in uploaded legal documents.</p>
                    </div>
                </div>
            </section>

            {/* 🟦 SECTION 6: USER ROLES */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { role: "Citizens", icon: "👥", desc: "Legal Literacy" },
                            { role: "Students", icon: "🎓", desc: "Case Research" },
                            { role: "Lawyers", icon: "⚖️", desc: "Drafting Aid" },
                            { role: "Judges", icon: "🏛️", desc: "Quick Reference" }
                        ].map((r, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-3xl mb-3">
                                    {r.icon}
                                </div>
                                <h4 className="font-bold text-lg">{r.role}</h4>
                                <div className="text-sm text-slate-500">{r.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 🟦 SECTION 7: FOOTER */}
            <footer className="bg-slate-900 text-slate-400 py-8 text-sm">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white">Privacy Policy</a>
                        <a href="#" className="hover:text-white">Accessibility</a>
                        <a href="#" className="hover:text-white">Terms of Use</a>
                        <a href="#" className="hover:text-white">Feedback</a>
                    </div>
                    <div>
                        © Department of Justice
                    </div>
                </div>
            </footer>
        </div>
    );
}
