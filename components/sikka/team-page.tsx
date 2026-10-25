'use client';
import { ArrowUpRight, Sparkles, Code2, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { sikkaTeam } from '@/lib/sikka-team';
function Linkedin({size=19}:{size?:number}) {return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 2H3.55A1.55 1.55 0 0 0 2 3.55v16.9A1.55 1.55 0 0 0 3.55 22h16.9A1.55 1.55 0 0 0 22 20.45V3.55A1.55 1.55 0 0 0 20.45 2ZM8.09 18.75H5.13V9.2h2.96ZM6.61 7.9A1.72 1.72 0 1 1 6.6 4.46a1.72 1.72 0 0 1 .01 3.44ZM18.76 18.75H15.8V14.1c0-1.1-.02-2.52-1.54-2.52-1.54 0-1.78 1.2-1.78 2.44v4.73H9.52V9.2h2.84v1.3h.04a3.12 3.12 0 0 1 2.8-1.54c3 0 3.56 1.98 3.56 4.55Z"/></svg>;}
export function TeamPage() {
  return <div className="container page-space team-page">
    <section className="team-intro">
      <div className="eyebrow">الأشخاص اللي وراء سكة</div>
      <h1>جمعتنا الفكرة،<br/>ومشيناها <span>سوا.</span></h1>
      <p>حنا فريق سكة. نحب التجارب اللي تجمع الناس، ونبني شي يخلّي يوم الملاهي أسهل وأحلى.</p>
      <span className="team-intro-mark" aria-hidden="true">✦</span>
      <div className="team-values"><span><Users size={16}/>فريق واحد</span><span><Code2 size={16}/>من الفكرة للتجربة</span><span><Sparkles size={16}/>الوناسة لها سكة</span></div>
    </section>
    <div className="team-grid">{sikkaTeam.map((member, i) => <motion.article key={member.name} className={`team-card team-${member.color}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .07 }}>
      <div className="team-card-top"><span className="team-number">0{i + 1}</span><Code2 size={21}/></div>
      <span className="team-avatar">{member.initial}</span><h2>{member.name}</h2><p>من فريق سكة</p>
      <div className="team-card-bottom">{member.linkedinUrl ? <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label={`حساب ${member.name} في لنكدن`}><Linkedin size={19}/>نتواصل على لنكدن<ArrowUpRight size={17}/></a> : <span className="team-link-pending"><Linkedin size={19}/>بانتظار رابط حساب لنكدن</span>}</div>
    </motion.article>)}</div>
    <p className="team-link-note">ودّك تعرفنا أكثر؟ تلقانا على لنكدن، وحياك بسكتنا.</p>
  </div>;
}
