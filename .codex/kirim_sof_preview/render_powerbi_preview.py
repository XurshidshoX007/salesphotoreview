import json
from pathlib import Path
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
import numpy as np

OUT=Path(r'C:\Users\Xursh\Desktop\disturibitsiya-avto-tekshiruv-1522-fix\disturibitsiya-sohasida-operatorman-sales-programmadan-kirib\outputs\powerbi-kirim-sof')
d=json.loads((OUT/'dashboard_data.json').read_text(encoding='utf-8'))
plt.rcParams.update({'font.family':'DejaVu Sans','axes.titleweight':'bold','axes.titlesize':11,'axes.labelsize':8,'xtick.labelsize':7,'ytick.labelsize':7})
fig=plt.figure(figsize=(16,10),dpi=140,facecolor='#F3F7F8')

def card(x,y,w,h,title,value,color='#13232F',accent='#0F766E'):
    fig.add_artist(FancyBboxPatch((x,y),w,h,boxstyle='round,pad=0.006,rounding_size=0.012',transform=fig.transFigure,facecolor='white',edgecolor='#D9E4E8',linewidth=.8))
    fig.add_artist(FancyBboxPatch((x,y),.006,h,boxstyle='round,pad=0,rounding_size=0.004',transform=fig.transFigure,facecolor=accent,edgecolor=accent))
    fig.text(x+.018,y+h-.032,title,fontsize=8.5,color='#64748B',weight='bold')
    fig.text(x+.018,y+.022,value,fontsize=18,color=color,weight='bold')

fig.text(.035,.948,'KIRIM VA SAVDO NAZORATI',fontsize=22,weight='bold',color='#13232F')
fig.text(.035,.917,'LM va SOF · 11-iyul 2026 · Power BI dashboard konsepti',fontsize=9,color='#64748B')
fig.text(.875,.94,'LM',fontsize=9,weight='bold',color='#0F766E');fig.text(.91,.94,'SOF',fontsize=9,weight='bold',color='#2563EB')

t=d['totals']; fmt=lambda v:f'{abs(v)/1e9:.2f} mlrd' if abs(v)>=1e9 else f'{abs(v)/1e6:.1f} mln'
cards=[('Jami savdo',fmt(t['jami_savdo']),'#13232F','#0F766E'),('Jami kirim',fmt(t['jami_kirim']),'#13232F','#2563EB'),('Naqd savdo',fmt(t['naqd_savdo']),'#13232F','#0F766E'),('Farq','−'+fmt(t['farq']),'#C2413B','#C2413B'),('Qarzdorlik','−'+fmt(t['qarzdorlik']),'#C2413B','#D97706'),('Filiallar',str(t['filiallar']),'#13232F','#64748B')]
for i,(a,b,c,e) in enumerate(cards):card(.035+i*.157,.805,.145,.09,a,b,c,e)

def panel(rect):
    x,y,w,h=rect
    fig.add_artist(FancyBboxPatch((x,y),w,h,boxstyle='round,pad=0.006,rounding_size=0.012',transform=fig.transFigure,facecolor='white',edgecolor='#D9E4E8',linewidth=.8,zorder=0))
    return fig.add_axes([x+.018,y+.03,w-.036,h-.065],facecolor='white',zorder=1)

# Sales by branch: top 10 combined
ax=panel((.035,.46,.57,.31))
branches={}
for r in d['sales']:
    branches.setdefault(r['filial'],{'LM':0,'SOF':0});branches[r['filial']][r['brand']]+=r['savdo']
top=sorted(branches.items(),key=lambda kv:sum(kv[1].values()),reverse=True)[:10]
names=[x[0] for x in top][::-1]; lm=[x[1]['LM']/1e6 for x in top][::-1]; sof=[x[1]['SOF']/1e6 for x in top][::-1]
y=np.arange(len(names));ax.barh(y,lm,color='#0F766E',height=.34,label='LM');ax.barh(y+.35,sof,color='#2563EB',height=.34,label='SOF')
ax.set_yticks(y+.17,names);ax.set_title('Savdo filiallar bo‘yicha · Top 10',loc='left',pad=14);ax.set_xlabel('mln so‘m');ax.grid(axis='x',color='#E8EEF1',linewidth=.7);ax.spines[:].set_visible(False);ax.legend(frameon=False,ncol=2,loc='lower right',fontsize=8)

# Debt ranking
ax=panel((.625,.46,.34,.31))
debts={}
for r in d['cash']:debts[r['filial']]=debts.get(r['filial'],0)+r['qarzdorlik_abs']
topd=sorted(debts.items(),key=lambda kv:kv[1],reverse=True)[:8][::-1]
ax.barh([x[0] for x in topd],[x[1]/1e6 for x in topd],color='#D97706',height=.58)
ax.set_title('Qarzdorlik hajmi · Top 8',loc='left',pad=14);ax.set_xlabel('mln so‘m');ax.grid(axis='x',color='#E8EEF1',linewidth=.7);ax.spines[:].set_visible(False)

# Scatter
ax=panel((.035,.105,.43,.31))
colors={'LM':'#0F766E','SOF':'#2563EB'}
for brand in ['LM','SOF']:
    rows=[r for r in d['merged'] if r['brand']==brand]
    ax.scatter([r['kirim']/1e6 for r in rows],[r['savdo']/1e6 for r in rows],s=40,c=colors[brand],alpha=.78,label=brand,edgecolor='white',linewidth=.5)
ax.set_title('Savdo va kirim munosabati',loc='left',pad=14);ax.set_xlabel('Kirim · mln so‘m');ax.set_ylabel('Savdo · mln so‘m');ax.grid(color='#E8EEF1',linewidth=.7);ax.spines[:].set_visible(False);ax.legend(frameon=False,fontsize=8)

# Top agents
ax=panel((.485,.105,.48,.31))
agents=d['topAgents'][:10][::-1]
ax.barh([r['agent_kodi'] for r in agents],[r['tolov']/1e6 for r in agents],color=['#2563EB' if r['brand']=='SOF' else '#0F766E' for r in agents],height=.58)
ax.set_title('Eng katta agent to‘lovlari · Top 10',loc='left',pad=14);ax.set_xlabel('mln so‘m');ax.grid(axis='x',color='#E8EEF1',linewidth=.7);ax.spines[:].set_visible(False)

fig.text(.035,.055,'Filtrlar:  Brand  ·  Filial  ·  Sana',fontsize=8.5,color='#64748B')
fig.text(.965,.055,'Manba: Kirim SOF_LM.xlsx',fontsize=8.5,color='#64748B',ha='right')
plt.savefig(OUT/'Kirim_SOF_PowerBI_preview.png',bbox_inches='tight',facecolor=fig.get_facecolor())
