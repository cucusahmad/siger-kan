export default function BusinessLoading() {
  return <div className="animate-pulse space-y-6" aria-label="Memuat profil usaha" role="status"><div className="h-64 rounded-3xl bg-slate-200" /><div className="h-14 rounded-2xl bg-slate-200" />{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-72 rounded-2xl bg-slate-200" />)}<span className="sr-only">Memuat profil usaha...</span></div>;
}
