export default function Loading() { return <div className="space-y-5">{["h-20","h-28","h-80"].map((height,index) => <div key={index} className={`${height} animate-pulse rounded-2xl bg-slate-200`}/>)}</div>; }

