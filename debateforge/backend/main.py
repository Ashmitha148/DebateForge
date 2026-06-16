from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from io import BytesIO
from groq import Groq
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit

load_dotenv(dotenv_path=".env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class DebateRequest(BaseModel):
    topic: str
    user_argument: str

class MessageItem(BaseModel):
    role: str
    text: str
    score: Optional[int] = None
    fallacy: Optional[str] = None

class ReportRequest(BaseModel):
    topic: str
    mode: str
    final_score: int
    avg_score: float
    fallacies: List[str]
    messages: List[MessageItem]
    round_scores: List[int]

@app.post("/debate")
def debate(req: DebateRequest):
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": req.user_argument}],
        max_tokens=400,
        temperature=0.9,
    )
    return {"reply": response.choices[0].message.content}

@app.post("/export-pdf")
def export_pdf(req: ReportRequest):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    BG      = colors.HexColor("#0d0d0f")
    CARD    = colors.HexColor("#18181c")
    PURPLE  = colors.HexColor("#7F77DD")
    PURPDK  = colors.HexColor("#534AB7")
    WHITE   = colors.HexColor("#f0ede8")
    GREY    = colors.HexColor("#5a5860")
    GREYLT  = colors.HexColor("#3a3840")
    GREEN   = colors.HexColor("#6abf6a")
    ORANGE  = colors.HexColor("#c8922a")
    RED     = colors.HexColor("#c84040")
    DKRED   = colors.HexColor("#2a1212")
    REDBDR  = colors.HexColor("#5a1a1a")
    REDTXT  = colors.HexColor("#e07070")
    USERBG  = colors.HexColor("#1a2e1a")
    LINE    = colors.HexColor("#1e1e22")

    def sc(s):
        return GREEN if s>=70 else ORANGE if s>=45 else RED

    def box(x,y,w,h,r,fill,stroke=None):
        c.setFillColor(fill)
        c.setStrokeColor(stroke if stroke else fill)
        c.setLineWidth(0.5)
        c.roundRect(x,y,w,h,r,fill=1,stroke=1 if stroke else 0)

    # ── PAGE 1 ──
    c.setFillColor(BG); c.rect(0,0,width,height,fill=1,stroke=0)
    box(0,height-80*mm,width,80*mm,0,CARD)
    c.setStrokeColor(LINE); c.setLineWidth(0.5)
    c.line(0,height-80*mm,width,height-80*mm)

    c.setFillColor(WHITE); c.setFont("Helvetica-Bold",28)
    c.drawString(20*mm,height-28*mm,"Debate")
    c.setFillColor(PURPLE)
    c.drawString(20*mm+c.stringWidth("Debate","Helvetica-Bold",28),height-28*mm,"Forge")
    c.setFillColor(GREY); c.setFont("Helvetica",10)
    c.drawString(20*mm,height-38*mm,"Debate Report  ·  AI Red-Team Arena")

    mc = GREEN if req.mode=="easy" else ORANGE if req.mode=="medium" else RED
    box(width-50*mm,height-35*mm,30*mm,8*mm,3,colors.HexColor("#1e1e22"),mc)
    c.setFillColor(mc); c.setFont("Helvetica-Bold",9)
    c.drawCentredString(width-35*mm,height-30.5*mm,req.mode.upper())

    c.setFillColor(GREY); c.setFont("Helvetica",9)
    c.drawString(20*mm,height-50*mm,"TOPIC")
    c.setFillColor(WHITE); c.setFont("Helvetica",11)
    for i,line in enumerate(simpleSplit(f'"{req.topic}"',"Helvetica",11,width-50*mm)[:2]):
        c.drawString(20*mm,height-58*mm-i*6*mm,line)

    ys = height-120*mm
    c.setFillColor(sc(req.final_score)); c.setFont("Helvetica-Bold",64)
    sw = c.stringWidth(str(req.final_score),"Helvetica-Bold",64)
    c.drawString(width/2-sw/2,ys,str(req.final_score))
    c.setFont("Helvetica-Bold",24)
    c.drawString(width/2-sw/2+sw+2,ys+8,"/100")
    c.setFillColor(GREY); c.setFont("Helvetica",11)
    v = "Strong debater!" if req.final_score>=70 else "Decent effort." if req.final_score>=45 else "Needs more work."
    c.drawCentredString(width/2,ys-14*mm,v)

    yst=ys-40*mm; bw=(width-40*mm)/4
    for i,(l,val,vc) in enumerate(zip(
        ["AVG SCORE","FALLACIES","ROUNDS","MODE"],
        [str(round(req.avg_score,1)),str(len(req.fallacies)),str(len(req.round_scores)),req.mode.capitalize()],
        [sc(req.avg_score*10),RED,PURPLE,mc]
    )):
        bx=20*mm+i*bw
        box(bx,yst,bw-4*mm,20*mm,4,CARD,LINE)
        c.setFillColor(GREYLT); c.setFont("Helvetica",7)
        c.drawCentredString(bx+(bw-4*mm)/2,yst+14*mm,l)
        c.setFillColor(vc); c.setFont("Helvetica-Bold",14)
        c.drawCentredString(bx+(bw-4*mm)/2,yst+5*mm,val)

    yb=yst-16*mm; bmax=width-80*mm
    c.setFillColor(GREY); c.setFont("Helvetica",8)
    c.drawString(20*mm,yb,"ARGUMENT STRENGTH BY ROUND")
    c.setStrokeColor(LINE); c.line(20*mm,yb-2*mm,width-20*mm,yb-2*mm)
    yb-=14*mm
    for i,s in enumerate(req.round_scores):
        c.setFillColor(GREY); c.setFont("Helvetica",9)
        c.drawString(20*mm,yb,f"Round {i+1}")
        c.setFillColor(LINE); c.roundRect(48*mm,yb-1*mm,bmax,5*mm,2,fill=1,stroke=0)
        c.setFillColor(PURPDK); c.roundRect(48*mm,yb-1*mm,(s/10)*bmax,5*mm,2,fill=1,stroke=0)
        c.setFillColor(PURPLE); c.setFont("Helvetica-Bold",9)
        c.drawString(width-26*mm,yb,str(s)); yb-=10*mm

    if req.fallacies:
        yf=yb-6*mm
        c.setFillColor(GREY); c.setFont("Helvetica",8)
        c.drawString(20*mm,yf,f"FALLACIES ({len(req.fallacies)})")
        c.setStrokeColor(LINE); c.line(20*mm,yf-2*mm,width-20*mm,yf-2*mm)
        xc=20*mm; yc=yf-12*mm
        for f in req.fallacies:
            cw=c.stringWidth(f,"Helvetica-Bold",9)+8*mm
            if xc+cw>width-20*mm: xc=20*mm; yc-=10*mm
            box(xc,yc-2*mm,cw,7*mm,3,DKRED,REDBDR)
            c.setFillColor(REDTXT); c.setFont("Helvetica-Bold",9)
            c.drawString(xc+4*mm,yc+1.5*mm,f); xc+=cw+3*mm

    c.setFillColor(GREYLT); c.setFont("Helvetica",8)
    c.drawCentredString(width/2,12*mm,"Generated by DebateForge · Page 1")

    # ── PAGE 2 ──
    c.showPage()
    c.setFillColor(BG); c.rect(0,0,width,height,fill=1,stroke=0)
    box(0,height-30*mm,width,30*mm,0,CARD)
    c.setStrokeColor(LINE); c.line(0,height-30*mm,width,height-30*mm)
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold",16)
    c.drawString(20*mm,height-18*mm,"Full Debate Transcript")
    c.setFillColor(GREY); c.setFont("Helvetica",9)
    c.drawString(20*mm,height-25*mm,f'Topic: "{req.topic}"')

    ym=height-42*mm; rnd=0; bmw=width-55*mm
    for msg in req.messages:
        iu=msg.role=="user"
        if iu: rnd+=1
        lns=simpleSplit(msg.text,"Helvetica",10,bmw-8*mm)
        ex=(10*mm if iu and msg.score else 0)+(12*mm if not iu and msg.fallacy else 0)
        bh=len(lns)*5.5*mm+12*mm+ex
        if ym-bh<18*mm:
            c.setFillColor(GREYLT); c.setFont("Helvetica",8)
            c.drawCentredString(width/2,12*mm,f"DebateForge · Page {c.getPageNumber()}")
            c.showPage(); c.setFillColor(BG); c.rect(0,0,width,height,fill=1,stroke=0)
            ym=height-20*mm
        bx=width-20*mm-bmw if iu else 20*mm
        box(bx,ym-bh,bmw,bh,6,USERBG if iu else colors.HexColor("#18181c"),
            colors.HexColor("#2a4a2a") if iu else LINE)
        c.setFillColor(GREEN if iu else PURPLE); c.setFont("Helvetica-Bold",8)
        c.drawString(bx+4*mm,ym-6*mm,f"{'You' if iu else 'DebateBot'}  ·  Round {rnd}")
        c.setFillColor(WHITE); c.setFont("Helvetica",10)
        yt=ym-13*mm
        for ln in lns: c.drawString(bx+4*mm,yt,ln); yt-=5.5*mm
        if iu and msg.score:
            by=ym-bh+8*mm; tw=bmw-34*mm
            c.setFillColor(GREYLT); c.setFont("Helvetica",7)
            c.drawString(bx+4*mm,by+2*mm,"Strength")
            c.setFillColor(LINE); c.roundRect(bx+22*mm,by,tw,3*mm,1.5,fill=1,stroke=0)
            c.setFillColor(PURPDK); c.roundRect(bx+22*mm,by,(msg.score/10)*tw,3*mm,1.5,fill=1,stroke=0)
            c.setFillColor(PURPLE); c.setFont("Helvetica-Bold",8)
            c.drawString(bx+bmw-10*mm,by,f"{msg.score}/10")
        if not iu and msg.fallacy:
            fy=ym-bh+3*mm
            box(bx+3*mm,fy,bmw-6*mm,9*mm,3,DKRED,REDBDR)
            c.setFillColor(REDTXT); c.setFont("Helvetica-Bold",8)
            c.drawString(bx+6*mm,fy+3*mm,f"Fallacy: {msg.fallacy}")
        ym-=bh+5*mm

    c.setFillColor(GREYLT); c.setFont("Helvetica",8)
    c.drawCentredString(width/2,12*mm,f"DebateForge · Page {c.getPageNumber()}")
    c.save(); buffer.seek(0)
    return StreamingResponse(buffer,media_type="application/pdf",
        headers={"Content-Disposition":"attachment; filename=debateforge-report.pdf"})