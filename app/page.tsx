'use client';

import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-50 via-white to-blue-50/30 flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden relative">
            {/* Decorative Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] -z-10 animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/10 rounded-full blur-[120px] -z-10 animate-pulse delay-700" />

            <div className="max-w-6xl w-full space-y-16 relative z-10">
                <header className="text-center space-y-6 animate-in fade-in slide-in-from-top-10 duration-1000">
                    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/50 backdrop-blur-md border border-blue-100 shadow-sm mb-4">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-400"></span>
                        </span>
                        <span className="text-sm font-black text-blue-900 tracking-wider">POC VERSION 2.1</span>
                    </div>
                    <h1 className="text-6xl sm:text-7xl font-[1000] text-gray-900 tracking-tight leading-tight">
                        LLM Performance <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient-x">Analysis Hub</span>
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                        최적의 모델과 최상의 프롬프트를 찾기 위한 전문 LLM 품질 분석 플랫폼입니다.
                        원하는 테스트 시나리오를 선택하세요.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Card 1: Model Evaluation */}
                    <Link href="/model-eval" className="group">
                        <div className="h-full p-8 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-blue-500/5 hover:shadow-blue-500/15 hover:border-blue-200 transition-all duration-500 flex flex-col items-start space-y-6 relative overflow-hidden transform hover:scale-[1.02]">
                            <div className="absolute top-0 right-0 p-8 transform group-hover:rotate-12 transition-transform opacity-10 group-hover:opacity-20">
                                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <line x1="3" y1="9" x2="21" y2="9" />
                                    <line x1="9" y1="21" x2="9" y2="9" />
                                </svg>
                            </div>
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-blue-200">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2v20" /><path d="m5 9 7-7 7 7" /><path d="m19 15-7 7-7-7" />
                                </svg>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">모델 성능 비교</h3>
                                <p className="text-gray-500 leading-relaxed font-medium text-sm">
                                    동일한 프롬프트로 여러 LLM 모델(GPT, Claude, Gemini)을 동시에 테스트하고 일관성 및 결과 품질을 비교 분석합니다.
                                </p>
                            </div>
                            <div className="mt-auto pt-4 flex items-center gap-2 text-blue-600 font-bold group-hover:gap-4 transition-all text-sm">
                                서비스 이동하기
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                            </div>
                        </div>
                    </Link>

                    {/* Card 2: Prompt Evaluation */}
                    <Link href="/prompt-eval" className="group">
                        <div className="h-full p-8 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-purple-500/5 hover:shadow-purple-500/15 hover:border-purple-200 transition-all duration-500 flex flex-col items-start space-y-6 relative overflow-hidden transform hover:scale-[1.02]">
                            <div className="absolute top-0 right-0 p-8 transform group-hover:rotate-12 transition-transform opacity-10 group-hover:opacity-20">
                                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                    <path d="m15 5 4 4" />
                                </svg>
                            </div>
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-purple-200">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    <path d="M8 9h8" /><path d="M8 13h6" />
                                </svg>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">프롬프트 A/B 비교</h3>
                                <p className="text-gray-500 leading-relaxed font-medium text-sm">
                                    시스템 프롬프트의 작은 변화가 결과에 미치는 영향을 분석합니다. 동일 모델/질문에서 프롬프트 버전별 품질과 안정성을 측정합니다.
                                </p>
                            </div>
                            <div className="mt-auto pt-4 flex items-center gap-2 text-purple-600 font-bold group-hover:gap-4 transition-all text-sm">
                                서비스 이동하기
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                            </div>
                        </div>
                    </Link>

                    {/* Card 3: Manual Evaluation */}
                    <Link href="/manual-eval" className="group">
                        <div className="h-full p-8 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-emerald-500/5 hover:shadow-emerald-500/15 hover:border-emerald-200 transition-all duration-500 flex flex-col items-start space-y-6 relative overflow-hidden transform hover:scale-[1.02]">
                            <div className="absolute top-0 right-0 p-8 transform group-hover:rotate-12 transition-transform opacity-10 group-hover:opacity-20">
                                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                    <polyline points="10 9 9 9 8 9" />
                                </svg>
                            </div>
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-emerald-200">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.7-3.7a1 1 0 0 0 0-1.4 1 1 0 0 0-1.4 0l-2.3 2.3-1.6-1.6a1 1 0 0 0-1.4 0Z" />
                                    <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5" />
                                </svg>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">수동 응답 비교</h3>
                                <p className="text-gray-500 leading-relaxed font-medium text-sm">
                                    직접 입력한 두 개의 LLM 응답을 비교 분석합니다. 공통 환경 및 개별 환경 설정을 포함하여 정밀한 LLM-as-a-Judge 평가를 수행합니다.
                                </p>
                            </div>
                            <div className="mt-auto pt-4 flex items-center gap-2 text-emerald-600 font-bold group-hover:gap-4 transition-all text-sm">
                                서비스 이동하기
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                            </div>
                        </div>
                    </Link>
                </div>

                <footer className="text-center text-gray-400 text-sm font-semibold tracking-wide uppercase">
                    &copy; 2026 Advanced AI Testing Hub • DeepMind Powered
                </footer>
            </div>

            <style jsx global>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 8s ease infinite;
        }
      `}</style>
        </div>
    );
}
