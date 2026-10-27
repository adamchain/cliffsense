/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import "./stay-connected.css";

export function StayConnectedPage({
  signInHref = "/auth/signin",
  signInLabel = "Sign in",
  startHref = "/auth/signup",
  startLabel = "Get Started",
}: {
  signInHref?: string | null;
  signInLabel?: string;
  startHref?: string;
  startLabel?: string;
}) {
  return (
<div className="sc-page" style={{ fontFamily: "var(--font-sans)", color: "#111B2E", background: "#F2F3FA", WebkitFontSmoothing: "antialiased" }}>

{/* HERO */}
<section id="top" className="hero" aria-label="Stay Connected">
<div className="hgrid" aria-hidden="true">
<div className="mt m1"><img src="/landing/hero-01.jpg" alt="" style={{ objectPosition: "40% 40%" }} /></div>
<div className="mt m2"><img src="/landing/hero-02.jpg" alt="" style={{ objectPosition: "50% 38%" }} /></div>
<div className="mt m3"><img src="/landing/hero-03.jpg" alt="" style={{ objectPosition: "48% 40%" }} /></div>
<div className="mt m4"><img src="/landing/hero-04.jpg" alt="" style={{ objectPosition: "32% 38%" }} /></div>
<div className="mt m5"><img src="/landing/hero-05.jpg" alt="" style={{ objectPosition: "52% 40%" }} /></div>
<div className="mt m6"><img src="/landing/hero-06.jpg" alt="" style={{ objectPosition: "56% 32%" }} /></div>
<div className="mt m7"><img src="/landing/hero-07.jpg" alt="" style={{ objectPosition: "42% 30%" }} /></div>
<div className="mt m8"><img src="/landing/hero-08.jpg" alt="" style={{ objectPosition: "62% 45%" }} /></div>
<div className="mt m9"><img src="/landing/hero-09.jpg" alt="" style={{ objectPosition: "50% 30%" }} /></div>
<div className="mt m10"><img src="/landing/hero-10.jpg" alt="" style={{ objectPosition: "50% 36%" }} /></div>
<div className="mt m11"><img src="/landing/hero-11.jpg" alt="" style={{ objectPosition: "36% 42%" }} /></div>
<div className="mt m12"><img src="/landing/hero-12.jpg" alt="" style={{ objectPosition: "50% 30%" }} /></div>
<div className="mt m13"><img src="/landing/hero-13.jpg" alt="" style={{ objectPosition: "50% 42%" }} /></div>
<div className="mt m14"><img src="/landing/hero-14.jpg" alt="" style={{ objectPosition: "46% 34%" }} /></div>
<div className="mt m15"><img src="/landing/hero-15.jpg" alt="" style={{ objectPosition: "50% 24%" }} /></div>
<div className="mt m16"><img src="/landing/hero-16.jpg" alt="" style={{ objectPosition: "48% 36%" }} /></div>
<div className="mt m17"><img src="/landing/hero-17.jpg" alt="" style={{ objectPosition: "30% 42%" }} /></div>
<div className="mt m18"><img src="/landing/hero-18.jpg" alt="" style={{ objectPosition: "64% 32%" }} /></div>
<div className="mt m19"><img src="/landing/hero-19.jpg" alt="" style={{ objectPosition: "48% 30%" }} /></div>
</div>
<div className="hshade" aria-hidden="true"></div>

<header className="navpill">
<a aria-label="Bene-Watch home" style={{ display: "flex", alignItems: "center" }} href="#top"><img src="/landing/logo.png" alt="Bene-Watch" style={{ height: "34px", width: "auto", display: "block" }} /></a>
<nav className="nav-links" aria-label="Main">
<a style={{ fontSize: "15px", fontWeight: "600", textDecoration: "none" }} href="#problem">The problem</a>
<a style={{ fontSize: "15px", fontWeight: "600", textDecoration: "none" }} href="#cost">Who it affects</a>
<a style={{ fontSize: "15px", fontWeight: "600", textDecoration: "none" }} href="#families">How it helps</a>
<a style={{ fontSize: "15px", fontWeight: "600", textDecoration: "none" }} href="#pilot">Pilot</a>
</nav>
<div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
{signInHref ? (
          <Link href={signInHref} style={{ fontSize: "15px", fontWeight: "600", textDecoration: "none" }}>{signInLabel}</Link>
        ) : null}
<Link className="btn btn-n" style={{ minHeight: "46px", padding: "0 22px" }} href={startHref}>{startLabel}</Link>
</div>
</header>

<div className="pawrap">
<svg className="paol" viewBox="1 -1 205 141" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="M2.25,19.25 L1.88,23.38 L2.00,138.40 L172.88,138.40 L174.88,138.00 L177.00,134.88 L179.50,133.12 L181.38,132.88 L183.75,133.88 L185.62,133.88 L187.50,133.00 L189.62,130.62 L191.00,127.25 L192.62,125.38 L194.62,124.12 L202.12,121.88 L204.75,119.12 L204.62,115.50 L203.50,114.00 L200.25,111.38 L198.62,106.75 L197.00,105.38 L194.50,104.25 L193.25,103.00 L192.88,101.12 L193.38,98.75 L192.88,97.00 L188.75,94.25 L187.12,91.50 L187.75,85.88 L189.12,83.75 L192.75,80.75 L193.38,78.62 L192.75,76.38 L190.62,73.62 L190.62,72.25 L191.12,71.25 L193.88,69.00 L195.75,66.75 L197.25,62.12 L201.62,57.75 L201.75,54.75 L200.12,53.12 L196.50,52.88 L194.50,52.25 L192.00,49.12 L188.25,48.00 L187.12,46.62 L184.75,42.00 L186.00,34.75 L185.62,30.50 L183.75,28.25 L180.12,27.50 L178.75,26.50 L177.88,25.00 L177.62,21.38 L176.88,20.12 L174.62,18.25 L171.25,17.62 L35.75,18.12 L34.62,17.75 L33.75,16.38 L33.75,0.38 L32.38,0.00 L4.50,17.12Z" fill="none" stroke="#FFFFFF" strokeOpacity=".9" strokeWidth="1.25" strokeLinejoin="round" vectorEffect="non-scaling-stroke"></path></svg>
<div className="pain">
<p className="cap" style={{ margin: "0 0 26px", color: "rgba(255,255,255,.85)", display: "inline-flex", alignItems: "center", gap: "12px" }}><span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#63B02F", display: "inline-block" }}></span>Keeping PA connected</p>
<h1 className="htitle" style={{ margin: "0", fontWeight: "800", lineHeight: ".92", letterSpacing: "-.03em", textTransform: "uppercase", color: "#FFFFFF", textShadow: "0 2px 40px rgba(0,0,0,.25)" }}>Stay <span style={{ color: "#63B02F" }}>Connected</span></h1>
<p style={{ margin: "28px auto 0", maxWidth: "620px", fontSize: "20px", fontWeight: "500", lineHeight: "1.55", color: "rgba(255,255,255,.9)" }}>Bene-Watch helps you track benefit requirements so you don&apos;t get lost in the shuffle.</p>
<div style={{ marginTop: "36px", display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
<a className="btn btn-w" href="#families">See how Bene-Watch works</a>
<Link className="btn btn-o" href={startHref}>{startLabel}</Link>
</div>
</div>
</div>

<div style={{ position: "absolute", left: "0", right: "0", bottom: "34px", zIndex: "2", padding: "0 24px" }}>
<div className="progs cap" style={{ fontSize: "11px", letterSpacing: ".22em", color: "rgba(255,255,255,.7)" }}>
<span>Medicaid</span><span>SNAP</span><span>Social Security</span><span>SSI</span><span>SSDI</span><span>CHIP</span><span>Medicare Savings Programs</span>
</div>
</div>
</section>

<section className="light" aria-label="Bene-Watch explainer">
<div className="wrap explainer">
<div className="explainer-frame">
<video
  controls
  playsInline
  preload="metadata"
  poster="/videos/bene-watch-explainer.jpg"
  src="/videos/bene-watch-explainer.mp4"
>
  Your browser does not support the video tag.
</video>
</div>
</div>
</section>

{/* 1 · THE PROBLEM */}
<section id="problem" className="dark">
<div className="wrap sec">
<div className="prob">
<div>
<p className="cap" style={{ margin: "0", color: "#7FB2FF" }}>Pennsylvania · Medicaid</p>
<div style={{ marginTop: "26px", maxWidth: "420px" }}>
<div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "700", letterSpacing: ".04em" }}><span>JAN 2025</span><span>JUN 2026</span></div>
<div style={{ marginTop: "8px", height: "3px", borderRadius: "2px", background: "linear-gradient(90deg, #3B82E6, #E78A15)" }}></div>
<div className="ticks" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
<p className="cap" style={{ margin: "8px 0 0", fontSize: "10px", color: "rgba(255,255,255,.55)" }}>18 months</p>
</div>
<p className="cap" style={{ margin: "56px 0 0", color: "#F2A24A" }}>More than half a million</p>
<div style={{ marginTop: "10px", fontSize: "clamp(76px, 9vw, 132px)", fontWeight: "800", lineHeight: ".95", letterSpacing: "-.045em" }}>523,711</div>
<p style={{ margin: "18px 0 0", fontSize: "clamp(26px, 2.6vw, 36px)", fontWeight: "700", lineHeight: "1.15", letterSpacing: "-.02em" }}>Medicaid closures<br /><span style={{ color: "#F2A24A" }}>for missing information</span></p>
</div>
<div>
<svg viewBox="2 4 211 144" role="img" aria-label="Map of Pennsylvania covered in dots representing Medicaid closures" style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
<path d="M7.25,26.12 L6.88,30.25 L7.00,143.88 L6.50,144.62 L5.00,145.12 L165.50,145.12 L166.62,145.75 L177.88,145.75 L179.88,144.88 L182.00,141.75 L184.50,140.00 L186.38,139.75 L188.75,140.75 L190.62,140.75 L192.50,139.88 L194.62,137.50 L196.00,134.12 L197.62,132.25 L199.62,131.00 L207.12,128.75 L209.75,126.00 L209.62,122.38 L208.50,120.88 L205.25,118.25 L203.62,113.62 L202.00,112.25 L199.50,111.12 L198.25,109.88 L197.88,108.00 L198.38,105.62 L197.88,103.88 L193.75,101.12 L192.12,98.38 L192.75,92.75 L194.12,90.62 L197.75,87.62 L198.38,85.50 L197.75,83.25 L195.62,80.50 L195.62,79.12 L196.12,78.12 L198.88,75.88 L200.75,73.62 L202.25,69.00 L206.62,64.62 L206.75,61.62 L205.12,60.00 L201.50,59.75 L199.50,59.12 L197.00,56.00 L193.25,54.88 L192.12,53.50 L189.75,48.88 L191.00,41.62 L190.62,37.38 L188.75,35.12 L185.12,34.38 L183.75,33.38 L182.88,31.88 L182.62,28.25 L181.88,27.00 L179.62,25.12 L176.25,24.50 L40.75,25.00 L39.62,24.62 L38.75,23.25 L38.75,7.25 L37.38,6.88 L9.50,24.00Z" fill="rgba(59,130,230,.10)" stroke="#4C9BFF" strokeWidth="1.6" strokeLinejoin="round"></path>
<g fill="#F08A2C" fillOpacity=".9"><circle cx="86.0" cy="29.2" r="1.1"></circle><circle cx="10.0" cy="83.3" r="1.8"></circle><circle cx="167.7" cy="112.8" r="1.4"></circle><circle cx="111.1" cy="57.4" r="1.4"></circle><circle cx="173.0" cy="43.9" r="1.1"></circle><circle cx="173.4" cy="118.5" r="1.8"></circle><circle cx="45.1" cy="50.4" r="1.8"></circle><circle cx="23.5" cy="91.0" r="1.8"></circle><circle cx="108.2" cy="32.4" r="1.8"></circle><circle cx="62.6" cy="137.4" r="2.3"></circle><circle cx="65.0" cy="104.6" r="1.8"></circle><circle cx="177.3" cy="77.6" r="1.8"></circle><circle cx="91.6" cy="47.5" r="1.8"></circle><circle cx="38.6" cy="49.8" r="1.1"></circle><circle cx="22.4" cy="71.4" r="1.8"></circle><circle cx="110.8" cy="96.8" r="1.8"></circle><circle cx="35.3" cy="100.3" r="1.1"></circle><circle cx="89.4" cy="35.8" r="1.8"></circle><circle cx="61.8" cy="56.7" r="2.3"></circle><circle cx="70.8" cy="84.5" r="1.8"></circle><circle cx="26.4" cy="16.4" r="1.4"></circle><circle cx="62.1" cy="87.8" r="1.4"></circle><circle cx="30.7" cy="136.0" r="1.8"></circle><circle cx="146.9" cy="130.7" r="1.8"></circle><circle cx="154.4" cy="139.5" r="1.1"></circle><circle cx="71.2" cy="52.1" r="1.4"></circle><circle cx="162.6" cy="64.2" r="2.3"></circle><circle cx="130.8" cy="130.5" r="1.8"></circle><circle cx="33.6" cy="60.3" r="1.4"></circle><circle cx="15.0" cy="31.2" r="1.8"></circle><circle cx="18.6" cy="109.0" r="2.3"></circle><circle cx="142.7" cy="28.5" r="1.1"></circle><circle cx="116.3" cy="87.8" r="1.8"></circle><circle cx="112.9" cy="114.0" r="1.8"></circle><circle cx="137.6" cy="35.4" r="1.4"></circle><circle cx="54.9" cy="64.3" r="1.1"></circle><circle cx="50.3" cy="68.8" r="1.8"></circle><circle cx="12.4" cy="42.9" r="1.4"></circle><circle cx="71.7" cy="130.1" r="1.8"></circle><circle cx="120.2" cy="143.7" r="1.8"></circle><circle cx="181.9" cy="106.3" r="1.1"></circle><circle cx="48.6" cy="127.7" r="1.4"></circle><circle cx="74.0" cy="98.0" r="1.8"></circle><circle cx="170.6" cy="80.3" r="1.8"></circle><circle cx="74.4" cy="61.7" r="1.8"></circle><circle cx="21.0" cy="141.0" r="1.4"></circle><circle cx="15.0" cy="131.2" r="1.4"></circle><circle cx="160.9" cy="44.9" r="1.1"></circle><circle cx="99.8" cy="72.7" r="1.8"></circle><circle cx="6.7" cy="134.4" r="1.1"></circle><circle cx="129.2" cy="43.3" r="1.8"></circle><circle cx="183.3" cy="83.4" r="1.4"></circle><circle cx="38.7" cy="91.3" r="2.3"></circle><circle cx="162.3" cy="72.6" r="2.3"></circle><circle cx="146.5" cy="23.5" r="2.3"></circle><circle cx="180.7" cy="91.3" r="1.4"></circle><circle cx="14.4" cy="18.9" r="2.3"></circle><circle cx="188.8" cy="48.7" r="1.8"></circle><circle cx="165.1" cy="50.6" r="1.4"></circle><circle cx="159.3" cy="125.2" r="1.8"></circle><circle cx="25.2" cy="23.7" r="2.3"></circle><circle cx="167.3" cy="58.1" r="1.8"></circle><circle cx="90.0" cy="105.4" r="1.8"></circle><circle cx="175.0" cy="65.9" r="2.3"></circle><circle cx="39.8" cy="127.8" r="1.4"></circle><circle cx="148.8" cy="52.7" r="1.8"></circle><circle cx="7.0" cy="31.1" r="1.8"></circle><circle cx="164.8" cy="90.3" r="2.3"></circle><circle cx="21.3" cy="41.6" r="1.8"></circle><circle cx="78.1" cy="113.0" r="1.1"></circle><circle cx="142.7" cy="91.5" r="1.8"></circle><circle cx="115.9" cy="132.6" r="2.3"></circle><circle cx="95.3" cy="27.3" r="2.3"></circle><circle cx="32.9" cy="19.3" r="1.4"></circle><circle cx="45.9" cy="116.8" r="2.3"></circle><circle cx="128.0" cy="79.8" r="1.1"></circle><circle cx="121.9" cy="136.5" r="1.1"></circle><circle cx="40.7" cy="73.6" r="1.4"></circle><circle cx="130.8" cy="121.9" r="1.8"></circle><circle cx="184.0" cy="40.5" r="1.8"></circle><circle cx="52.5" cy="52.7" r="2.3"></circle><circle cx="86.8" cy="62.9" r="1.8"></circle><circle cx="63.3" cy="64.4" r="1.1"></circle><circle cx="56.8" cy="130.9" r="1.8"></circle><circle cx="79.6" cy="138.3" r="2.3"></circle><circle cx="98.6" cy="140.2" r="1.8"></circle><circle cx="128.0" cy="50.8" r="1.1"></circle><circle cx="135.3" cy="73.3" r="2.3"></circle><circle cx="163.1" cy="28.4" r="1.4"></circle><circle cx="15.5" cy="62.5" r="2.3"></circle><circle cx="143.5" cy="83.0" r="2.3"></circle><circle cx="59.0" cy="79.8" r="1.4"></circle><circle cx="157.8" cy="36.2" r="1.8"></circle><circle cx="129.2" cy="94.5" r="1.4"></circle><circle cx="153.7" cy="97.8" r="1.4"></circle><circle cx="119.1" cy="103.0" r="2.3"></circle><circle cx="110.0" cy="81.6" r="1.8"></circle><circle cx="180.0" cy="53.0" r="1.8"></circle><circle cx="67.4" cy="116.2" r="1.1"></circle><circle cx="117.8" cy="73.3" r="2.3"></circle><circle cx="192.1" cy="136.4" r="1.8"></circle><circle cx="73.9" cy="31.6" r="2.3"></circle><circle cx="67.6" cy="96.6" r="1.8"></circle><circle cx="179.3" cy="98.7" r="1.8"></circle><circle cx="71.1" cy="73.2" r="1.8"></circle><circle cx="14.7" cy="79.1" r="2.3"></circle><circle cx="142.5" cy="54.1" r="2.3"></circle><circle cx="189.5" cy="103.4" r="1.1"></circle><circle cx="108.5" cy="129.8" r="2.3"></circle><circle cx="51.7" cy="45.6" r="1.1"></circle><circle cx="185.9" cy="141.4" r="1.1"></circle><circle cx="102.6" cy="27.8" r="1.8"></circle><circle cx="56.3" cy="109.2" r="1.8"></circle><circle cx="84.5" cy="90.9" r="1.1"></circle><circle cx="63.1" cy="36.4" r="1.8"></circle><circle cx="71.0" cy="37.4" r="1.8"></circle><circle cx="59.2" cy="47.3" r="1.4"></circle><circle cx="194.9" cy="115.2" r="2.3"></circle><circle cx="194.5" cy="99.6" r="1.8"></circle><circle cx="160.4" cy="96.4" r="1.1"></circle><circle cx="39.6" cy="41.5" r="1.1"></circle><circle cx="139.4" cy="132.3" r="1.1"></circle><circle cx="139.7" cy="144.1" r="1.1"></circle><circle cx="158.7" cy="117.8" r="1.4"></circle><circle cx="133.5" cy="108.8" r="2.3"></circle><circle cx="176.4" cy="143.1" r="1.4"></circle><circle cx="46.3" cy="26.9" r="1.8"></circle><circle cx="78.4" cy="48.6" r="1.8"></circle><circle cx="121.9" cy="34.7" r="2.3"></circle><circle cx="142.9" cy="60.6" r="2.3"></circle><circle cx="172.7" cy="108.2" r="2.3"></circle><circle cx="81.9" cy="71.5" r="1.8"></circle><circle cx="7.2" cy="103.6" r="1.8"></circle><circle cx="12.0" cy="115.4" r="1.8"></circle><circle cx="21.8" cy="30.1" r="2.3"></circle><circle cx="18.3" cy="122.4" r="1.4"></circle><circle cx="94.3" cy="117.6" r="1.4"></circle><circle cx="131.6" cy="26.4" r="2.3"></circle><circle cx="79.9" cy="126.2" r="1.4"></circle><circle cx="105.9" cy="121.5" r="1.1"></circle><circle cx="149.6" cy="89.8" r="1.1"></circle><circle cx="36.1" cy="32.1" r="2.3"></circle><circle cx="101.4" cy="46.7" r="1.1"></circle><circle cx="112.9" cy="124.9" r="1.8"></circle><circle cx="171.3" cy="35.7" r="1.1"></circle><circle cx="6.7" cy="47.9" r="2.3"></circle><circle cx="200.7" cy="130.1" r="2.3"></circle><circle cx="29.9" cy="95.8" r="1.1"></circle><circle cx="124.6" cy="86.6" r="2.3"></circle><circle cx="198.9" cy="69.9" r="1.8"></circle><circle cx="179.8" cy="30.7" r="1.1"></circle><circle cx="180.4" cy="117.3" r="1.8"></circle><circle cx="15.4" cy="137.2" r="2.3"></circle><circle cx="42.1" cy="133.7" r="1.8"></circle><circle cx="201.4" cy="61.9" r="1.4"></circle><circle cx="133.8" cy="138.0" r="1.8"></circle><circle cx="154.9" cy="84.4" r="1.8"></circle><circle cx="153.6" cy="61.8" r="1.1"></circle><circle cx="96.7" cy="79.9" r="1.1"></circle><circle cx="31.7" cy="68.0" r="1.8"></circle><circle cx="185.6" cy="62.2" r="1.1"></circle><circle cx="81.9" cy="77.8" r="1.1"></circle><circle cx="149.6" cy="67.6" r="1.8"></circle><circle cx="133.2" cy="100.2" r="1.4"></circle><circle cx="130.1" cy="114.2" r="1.4"></circle><circle cx="176.6" cy="25.0" r="1.1"></circle><circle cx="103.8" cy="90.2" r="1.4"></circle><circle cx="155.8" cy="55.7" r="2.3"></circle><circle cx="171.5" cy="137.6" r="1.1"></circle><circle cx="57.4" cy="93.2" r="1.4"></circle></g>
</svg>
</div>
</div>
<p style={{ margin: "72px 0 0", fontSize: "12px", lineHeight: "1.6", color: "rgba(255,255,255,.5)" }}>Source: PA DHS Medical Assistance closure records, Code 042 (required information not furnished), January 2025 – June 2026. Counts are closure entries, not unique individuals. Map dots are illustrative.</p>
</div>
</section>

{/* 2 · MISSING PAPERWORK */}
<section className="dark" style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
<div className="wrap sec" style={{ textAlign: "center" }}>
<h2 className="h2">Missing paperwork. <span style={{ color: "#F2A24A" }}>Lost coverage.</span></h2>
<div className="flow" style={{ marginTop: "64px", textAlign: "left" }}>
<div className="card" style={{ width: "340px", maxWidth: "100%", padding: "22px", boxSizing: "border-box" }}>
<div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
<div className="ic" style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#E8F1FE" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A7CF0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3.5h7l4.5 4.5v12.5H7z"></path><path d="M14 3.5V8h4.5"></path></svg></div>
<div><div style={{ fontSize: "17px", fontWeight: "800" }}>Renewal packet</div><div style={{ fontSize: "12px", color: "#6B768A", fontWeight: "500" }}>Medicaid · Household</div></div>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
<div className="row"><span>Household information</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#63B02F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-label="Complete" role="img"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></div>
<div className="row"><span>Address verification</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#63B02F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-label="Complete" role="img"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></div>
<div className="row" style={{ background: "#FDECEC", color: "#B42318" }}><span>Proof of income</span><span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: ".08em" }}>MISSING</span></div>
<div className="row"><span>Signature</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#63B02F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-label="Complete" role="img"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></div>
</div>
</div>
<svg className="arrow" width="64" height="24" viewBox="0 0 64 24" fill="none" stroke="#4C9BFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12h56M48 3l10 9-10 9"></path></svg>
<div className="card" style={{ width: "300px", maxWidth: "100%", padding: "24px", boxSizing: "border-box" }}>
<div className="cap" style={{ fontSize: "11px", color: "#6B768A" }}>Coverage status</div>
<div style={{ marginTop: "14px", display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 18px", borderRadius: "999px", background: "#FDECEC", color: "#D92D20", fontSize: "26px", fontWeight: "800", letterSpacing: ".02em" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D92D20" strokeWidth="3.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>CLOSED</div>
</div>
</div>
</div>
</section>

{/* 3 · EVERYONE PAYS */}
<section id="cost" className="dark" style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
<div className="wrap sec">
<div style={{ textAlign: "center" }}>
<p style={{ margin: "0", fontSize: "clamp(24px, 2.6vw, 36px)", fontWeight: "700", letterSpacing: "-.02em" }}>And when that happens,</p>
<p style={{ margin: "8px 0 0", fontSize: "clamp(56px, 7.5vw, 112px)", fontWeight: "800", lineHeight: "1", letterSpacing: "-.045em", color: "#F2A24A" }}>everyone pays.</p>
</div>
<div className="pays" style={{ marginTop: "80px" }}>

<div className="panel">
<div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
<div className="ic" style={{ background: "rgba(76,155,255,.14)" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7FB2FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"></path><path d="M12 9v6M9 12h6"></path></svg></div>
<div><div className="cap" style={{ fontSize: "10px", color: "rgba(255,255,255,.55)" }}>For</div><div style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-.01em" }}>Health plans</div></div>
</div>
<div>
<div style={{ textAlign: "center", fontSize: "12px", fontWeight: "700", color: "#FF8A80", marginBottom: "4px" }}>Care interrupted</div>
<svg viewBox="0 0 300 60" style={{ width: "100%", height: "auto", display: "block" }} aria-hidden="true"><path d="M0 34 H14 L20 34 L25 14 L31 52 L36 34 H52 L58 34 L63 14 L69 52 L74 34 H90 L96 34 L101 14 L107 52 L112 34 H196 L202 34 L207 14 L213 52 L218 34 H234 L240 34 L245 14 L251 52 L256 34 H272 L278 34 L283 14 L289 52 L294 34 H300" fill="none" stroke="#4C9BFF" strokeWidth="2" strokeLinejoin="round"></path></svg>
<div style={{ marginTop: "14px", display: "flex", height: "30px", borderRadius: "8px", overflow: "hidden", fontSize: "11px", fontWeight: "700", color: "#FFFFFF" }}>
<div style={{ flex: "3", background: "#63B02F", display: "flex", alignItems: "center", paddingLeft: "10px" }}>Covered</div>
<div className="hatch" style={{ flex: "2.2", display: "flex", alignItems: "center", justifyContent: "center" }}>Gap</div>
<div style={{ flex: "3", background: "#63B02F", display: "flex", alignItems: "center", paddingLeft: "10px" }}>Re-enrolled</div>
</div>
</div>
<p style={{ margin: "0", fontSize: "18px", fontWeight: "700" }}>More re-enrollment work</p>
</div>

<div className="panel">
<div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
<div className="ic" style={{ background: "rgba(242,162,74,.14)" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F2A24A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20V10l8-5 8 5v10"></path><path d="M9 20v-6h6v6"></path></svg></div>
<div><div className="cap" style={{ fontSize: "10px", color: "rgba(255,255,255,.55)" }}>For</div><div style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-.01em" }}>County programs &amp; caseworkers</div></div>
</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
<div className="card" style={{ padding: "14px" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: "800" }}><span>Household record</span><span style={{ fontSize: "9px", padding: "3px 7px", borderRadius: "999px", background: "#EAF6E2", color: "#3B7A1E" }}>On file</span></div>
<div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "7px" }}><span style={{ height: "5px", width: "80%", borderRadius: "3px", background: "#C9D3E4" }}></span><span style={{ height: "5px", width: "92%", borderRadius: "3px", background: "#C9D3E4" }}></span><span style={{ height: "5px", width: "70%", borderRadius: "3px", background: "#C9D3E4" }}></span><span style={{ height: "5px", width: "86%", borderRadius: "3px", background: "#C9D3E4" }}></span></div>
</div>
<div className="card" style={{ padding: "14px" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: "800" }}><span>Household record</span><span style={{ fontSize: "9px", padding: "3px 7px", borderRadius: "999px", background: "#FDF1E3", color: "#A75A06" }}>Rebuilding</span></div>
<div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "7px" }}><span style={{ height: "5px", width: "64%", borderRadius: "3px", background: "#F2A24A" }}></span><span style={{ height: "5px", width: "78%", borderRadius: "3px", background: "#F2A24A" }}></span><span style={{ height: "5px", width: "40%", borderRadius: "3px", background: "#F7D2A8" }}></span><span style={{ height: "5px", width: "22%", borderRadius: "3px", background: "#F7D2A8" }}></span></div>
</div>
</div>
<p style={{ margin: "0", fontSize: "18px", fontWeight: "700" }}>Rebuilding records that <span style={{ color: "#F2A24A" }}>already existed</span></p>
</div>

<div className="panel">
<div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
<div className="ic" style={{ background: "rgba(76,155,255,.14)" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7FB2FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9.5 12 4l9 5.5"></path><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3.5 20.5h17"></path></svg></div>
<div><div className="cap" style={{ fontSize: "10px", color: "rgba(255,255,255,.55)" }}>For</div><div style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-.01em" }}>The Commonwealth</div></div>
</div>
<div>
<div style={{ fontSize: "14px", fontWeight: "700" }}>Administrative cost <span style={{ fontWeight: "500", color: "rgba(255,255,255,.55)" }}>· at a tough time</span></div>
<div className="bars" style={{ marginTop: "14px", height: "96px" }} aria-hidden="true"><span style={{ height: "32%", background: "#2A4F86" }}></span><span style={{ height: "42%", background: "#2F5C9C" }}></span><span style={{ height: "52%", background: "#3567AE" }}></span><span style={{ height: "64%", background: "#3B72C0" }}></span><span style={{ height: "78%", background: "#4380D2" }}></span><span style={{ height: "100%", background: "#E78A15" }}></span></div>
<div className="card" style={{ marginTop: "16px", padding: "14px" }}>
<div style={{ fontSize: "13px", fontWeight: "800" }}>Managing SNAP</div>
<div style={{ fontSize: "11px", color: "#6B768A", fontWeight: "500" }}>Who pays the administrative cost</div>
<div style={{ marginTop: "10px", display: "flex", height: "26px", borderRadius: "7px", overflow: "hidden", fontSize: "11px", fontWeight: "700", color: "#FFFFFF" }}><div style={{ flex: "1", background: "#2F5C9C", display: "flex", alignItems: "center", paddingLeft: "10px" }}>Federal</div><div style={{ flex: "3", background: "#E78A15", display: "flex", alignItems: "center", paddingLeft: "10px" }}>State share</div></div>
<div style={{ marginTop: "10px", fontSize: "12px", fontWeight: "700", color: "#A75A06" }}>↑ States now pay a bigger share</div>
</div>
</div>
</div>

</div>
<p style={{ margin: "40px 0 0", fontSize: "12px", lineHeight: "1.6", color: "rgba(255,255,255,.5)" }}>Beginning federal fiscal year 2027, the state share of SNAP administrative costs rises from 50% to 75% under the 2025 reconciliation law (Public Law 119-21). Cost bars are illustrative.</p>
</div>
</section>

{/* 4 · THE TOOL */}
<section id="solution" className="light">
<div className="wrap sec" style={{ textAlign: "center" }}>
<img src="/landing/logo.png" alt="Bene-Watch" style={{ height: "clamp(56px, 7vw, 96px)", width: "auto", display: "inline-block" }} />
<p style={{ margin: "22px 0 0", fontSize: "clamp(22px, 2.4vw, 30px)", fontWeight: "700", letterSpacing: "-.02em", color: "#5B667A" }}>A <span style={{ color: "#E78A15" }}>benefit-continuity</span> tool</p>
<p style={{ margin: "64px 0 22px", fontSize: "16px", fontWeight: "600", color: "#5B667A" }}>for households on benefits like</p>
<div className="chips">
<span className="chip">Medicaid</span><span className="chip">SNAP</span><span className="chip">Social Security</span><span className="chip">SSI &amp; SSDI</span><span className="chip">CHIP</span><span className="chip">Medicare Savings Programs</span>
</div>

<h2 id="features" className="h2" style={{ marginTop: "128px", fontSize: "clamp(30px, 3.4vw, 46px)" }}>Working <span style={{ color: "#1A7CF0" }}>with</span> the current system</h2>
<div className="sys" style={{ marginTop: "48px" }}>
<div className="card" style={{ width: "280px", padding: "24px", textAlign: "left", boxSizing: "border-box" }}>
<div className="ic" style={{ background: "#EEF1F7" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5B667A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9.5 12 4l9 5.5"></path><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3.5 20.5h17"></path></svg></div>
<div style={{ marginTop: "14px", fontSize: "20px", fontWeight: "800" }}>Current system</div>
<div style={{ marginTop: "4px", fontSize: "13px", color: "#6B768A", fontWeight: "500" }}>Agencies · renewals · notices</div>
</div>
<div className="link" style={{ width: "96px", height: "0", borderTop: "3px dotted #1A7CF0" }}></div>
<div className="card" style={{ width: "280px", height: "132px", padding: "24px", display: "grid", placeItems: "center", boxSizing: "border-box" }}>
<img src="/landing/logo.png" alt="Bene-Watch" style={{ width: "100%", height: "auto", display: "block" }} />
</div>
</div>
<p style={{ margin: "28px auto 0", maxWidth: "560px", fontSize: "16px", lineHeight: "1.6", color: "#5B667A" }}>Bene-Watch works alongside official systems. Families still submit through official channels, with their own record of what was sent and what&apos;s still open.</p>
</div>
</section>

{/* 5 · DESIGNED TO HELP FAMILIES */}
<section id="families" className="light" style={{ paddingTop: "0" }}>
<div className="wrap" style={{ paddingBottom: "128px" }}>
<h2 id="how-it-works" className="h2" style={{ textAlign: "center" }}>Designed to help families</h2>
<div className="fam" style={{ marginTop: "56px" }}>

<div className="card fcard">
<div className="ic" style={{ background: "#E8F1FE" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A7CF0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5"></rect><path d="M3.5 10h17M8 3v4M16 3v4"></path></svg></div>
<div style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-.01em" }}>See what&apos;s due</div>
<div className="due"><div className="dbox"><div style={{ fontSize: "9px", fontWeight: "800", color: "#D92D20" }}>AUG</div><div style={{ fontSize: "18px", fontWeight: "800" }}>18</div></div><div><div style={{ fontSize: "14px", fontWeight: "700" }}>SNAP renewal</div><div style={{ fontSize: "12px", color: "#6B768A" }}>in 13 days</div></div></div>
<div className="due"><div className="dbox"><div style={{ fontSize: "9px", fontWeight: "800", color: "#D92D20" }}>OCT</div><div style={{ fontSize: "18px", fontWeight: "800" }}>1</div></div><div><div style={{ fontSize: "14px", fontWeight: "700" }}>SSDI review</div><div style={{ fontSize: "12px", color: "#6B768A" }}>Oct 1</div></div></div>
<div className="due"><div className="dbox"><div style={{ fontSize: "9px", fontWeight: "800", color: "#D92D20" }}>FEB</div><div style={{ fontSize: "18px", fontWeight: "800" }}>2</div></div><div><div style={{ fontSize: "14px", fontWeight: "700" }}>Medicaid renewal</div><div style={{ fontSize: "12px", color: "#6B768A" }}>Feb 2</div></div></div>
</div>

<div className="card fcard">
<div className="ic" style={{ background: "#EAF6E2" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B7A1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3.5h7l4.5 4.5v12.5H7z"></path><path d="M14 3.5V8h4.5M10 13.5l2 2 3.5-3.5"></path></svg></div>
<div style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-.01em" }}>Prepare forms</div>
<div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
<div className="chk"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#63B02F"></circle><path d="M7.5 12.5l3 3 6-6" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path></svg>Income proof attached</div>
<div className="chk"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#63B02F"></circle><path d="M7.5 12.5l3 3 6-6" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path></svg>Household info confirmed</div>
<div className="chk"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#63B02F"></circle><path d="M7.5 12.5l3 3 6-6" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path></svg>Signature added</div>
<div className="chk"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#63B02F"></circle><path d="M7.5 12.5l3 3 6-6" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path></svg>Copy saved</div>
</div>
<div style={{ marginTop: "6px", height: "6px", borderRadius: "3px", background: "#63B02F" }}></div>
<div style={{ fontSize: "13px", fontWeight: "700", color: "#3B7A1E" }}>Packet ready</div>
</div>

<div className="card fcard">
<div className="ic" style={{ background: "#FDF1E3" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C26C07" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"></path><path d="M10 20.5a2.2 2.2 0 0 0 4 0"></path></svg></div>
<div style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-.01em" }}>Flag income changes</div>
<div style={{ background: "#0F1E3D", borderRadius: "12px", padding: "16px", color: "#FFFFFF" }}>
<div className="cap" style={{ fontSize: "9px", color: "rgba(255,255,255,.6)" }}>Example · monthly income limit</div>
<div style={{ marginTop: "8px", fontSize: "28px", fontWeight: "800", letterSpacing: "-.02em" }}>$1,180 <span style={{ fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,.6)" }}>of $1,016 limit</span></div>
<div style={{ marginTop: "12px", height: "6px", borderRadius: "3px", background: "rgba(255,255,255,.15)", overflow: "hidden" }}><div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, #63B02F, #E78A15)" }}></div></div>
</div>
<div style={{ fontSize: "13px", fontWeight: "700", color: "#A75A06" }}>⚠ Income change: review the limit</div>
</div>

</div>
<p style={{ margin: "24px 0 0", textAlign: "center", fontSize: "13px", color: "#6B768A" }}>Example data shown. Some features are in development; availability varies by program and release.</p>
</div>
</section>

{/* 6 · VAULT */}
<section id="tools" style={{ background: "#FFFFFF" }}>
<div className="wrap sec">
<div className="vault">
<div>
<h2 id="snt-tracking" className="h2" style={{ fontSize: "clamp(30px, 3.4vw, 46px)" }}>Notices, documents &amp; records</h2>
<span style={{ display: "inline-block", marginTop: "16px", padding: "7px 14px", borderRadius: "999px", background: "#1A7CF0", color: "#FFFFFF", fontSize: "13px", fontWeight: "700" }}>All in one place</span>
<div className="card" style={{ marginTop: "32px", padding: "24px" }}>
<div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "18px", fontWeight: "800", marginBottom: "18px" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A7CF0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"></path></svg>Household vault</div>
<div className="folders">
<div className="folder"><svg width="34" height="28" viewBox="0 0 34 28" aria-hidden="true"><path d="M2 5a3 3 0 0 1 3-3h8l3 3h13a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z" fill="#3B8BF5"></path></svg><div style={{ fontSize: "13px", fontWeight: "700" }}>Agency notices</div></div>
<div className="folder"><svg width="34" height="28" viewBox="0 0 34 28" aria-hidden="true"><path d="M2 5a3 3 0 0 1 3-3h8l3 3h13a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z" fill="#3B8BF5"></path></svg><div style={{ fontSize: "13px", fontWeight: "700" }}>Proof of income</div></div>
<div className="folder"><svg width="34" height="28" viewBox="0 0 34 28" aria-hidden="true"><path d="M2 5a3 3 0 0 1 3-3h8l3 3h13a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z" fill="#3B8BF5"></path></svg><div style={{ fontSize: "13px", fontWeight: "700" }}>Medical records</div></div>
<div className="folder"><svg width="34" height="28" viewBox="0 0 34 28" aria-hidden="true"><path d="M2 5a3 3 0 0 1 3-3h8l3 3h13a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z" fill="#3B8BF5"></path></svg><div style={{ fontSize: "13px", fontWeight: "700" }}>Proof of disability</div></div>
<div className="folder" style={{ background: "#E8F1FE" }}><svg width="34" height="28" viewBox="0 0 34 28" aria-hidden="true"><path d="M2 5a3 3 0 0 1 3-3h8l3 3h13a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z" fill="#3B8BF5"></path></svg><div style={{ fontSize: "13px", fontWeight: "700" }}>Household records</div></div>
<div className="folder"><svg width="34" height="28" viewBox="0 0 34 28" aria-hidden="true"><path d="M2 5a3 3 0 0 1 3-3h8l3 3h13a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z" fill="#3B8BF5"></path></svg><div style={{ fontSize: "13px", fontWeight: "700" }}>Other</div></div>
</div>
</div>
</div>
<div style={{ paddingTop: "8px" }}>
<p style={{ margin: "0 0 18px", fontSize: "15px", fontWeight: "600", color: "#5B667A" }}>Helps everyone serve households</p>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<div className="card who"><div className="ic" style={{ background: "#E8F1FE" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A7CF0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5"></circle><path d="M5 20c.8-3.6 3.6-6 7-6s6.2 2.4 7 6"></path></svg></div>Caregivers</div>
<div className="card who"><div className="ic" style={{ background: "#FDF1E3" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C26C07" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20V10l8-5 8 5v10"></path><path d="M9 20v-6h6v6"></path></svg></div>Caseworkers</div>
<div className="card who"><div className="ic" style={{ background: "#EAF6E2" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B7A1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"></path><path d="M12 9v6M9 12h6"></path></svg></div>Health plans</div>
</div>
</div>
</div>
</div>
</section>

{/* 7 · PILOT */}
<section id="pilot" className="light">
<div className="wrap sec">
<div className="pilot">
<div>
<p className="cap" style={{ margin: "0", color: "#C26C07" }}>Now inviting partners</p>
<h2 id="partners" className="h2" style={{ marginTop: "18px", fontSize: "clamp(38px, 4.6vw, 64px)" }}>A limited, independently evaluated <span style={{ color: "#1A7CF0" }}>Pennsylvania pilot</span></h2>
<p style={{ margin: "22px 0 0", maxWidth: "560px", fontSize: "17px", lineHeight: "1.6", color: "#5B667A" }}>For health plans, county programs, nonprofits, special-needs law firms and caregiving organizations.</p>
</div>
<div>
<svg viewBox="1 2 214 150" role="img" aria-label="Pennsylvania outline with a green check mark" style={{ width: "100%", maxWidth: "420px", height: "auto", display: "block", marginLeft: "auto" }}><path d="M7.25,26.12 L6.88,30.25 L7.00,143.88 L6.50,144.62 L5.00,145.12 L165.50,145.12 L166.62,145.75 L177.88,145.75 L179.88,144.88 L182.00,141.75 L184.50,140.00 L186.38,139.75 L188.75,140.75 L190.62,140.75 L192.50,139.88 L194.62,137.50 L196.00,134.12 L197.62,132.25 L199.62,131.00 L207.12,128.75 L209.75,126.00 L209.62,122.38 L208.50,120.88 L205.25,118.25 L203.62,113.62 L202.00,112.25 L199.50,111.12 L198.25,109.88 L197.88,108.00 L198.38,105.62 L197.88,103.88 L193.75,101.12 L192.12,98.38 L192.75,92.75 L194.12,90.62 L197.75,87.62 L198.38,85.50 L197.75,83.25 L195.62,80.50 L195.62,79.12 L196.12,78.12 L198.88,75.88 L200.75,73.62 L202.25,69.00 L206.62,64.62 L206.75,61.62 L205.12,60.00 L201.50,59.75 L199.50,59.12 L197.00,56.00 L193.25,54.88 L192.12,53.50 L189.75,48.88 L191.00,41.62 L190.62,37.38 L188.75,35.12 L185.12,34.38 L183.75,33.38 L182.88,31.88 L182.62,28.25 L181.88,27.00 L179.62,25.12 L176.25,24.50 L40.75,25.00 L39.62,24.62 L38.75,23.25 L38.75,7.25 L37.38,6.88 L9.50,24.00Z" fill="#DCE9FB" stroke="#15396C" strokeWidth="4.2" strokeLinejoin="round"></path><path fill="#63B02F" d="M84.07,129.38C83.68,128.37 83.59,128.27 82.82,127.86C81.76,127.31 81.38,126.89 80.82,125.73C80.55,125.16 80.06,124.29 79.73,123.81C79.40,123.32 79.02,122.69 78.87,122.42C78.49,121.67 76.51,118.69 76.33,118.58C76.24,118.52 76.08,118.15 75.98,117.74C75.86,117.26 75.48,116.63 74.90,115.96C73.36,114.15 73.07,113.78 72.41,112.67C71.76,111.57 69.85,109.33 68.17,107.69C67.66,107.20 67.10,106.47 66.92,106.08C66.62,105.44 65.34,104.07 61.71,100.47C61.27,100.04 60.54,99.28 60.08,98.79C58.97,97.60 55.12,94.31 54.08,93.65C53.25,93.13 53.03,92.94 51.04,91.07C49.65,89.75 49.48,89.09 50.48,88.92C51.31,88.78 51.38,88.69 51.13,88.04C50.87,87.34 51.29,86.67 51.99,86.67C52.32,86.67 52.87,86.38 53.67,85.77C54.40,85.22 55.43,84.65 56.29,84.32C57.61,83.81 57.74,83.72 58.02,83.08C58.18,82.70 58.68,82.09 59.12,81.73C60.52,80.56 63.52,79.20 64.02,79.51C64.73,79.97 65.50,79.61 65.50,78.82C65.50,78.45 65.67,78.43 66.49,78.69C68.30,79.27 68.79,79.56 70.14,80.83C71.03,81.67 71.73,82.19 72.06,82.26C72.83,82.43 75.82,85.07 77.17,86.79C77.37,87.04 77.99,87.74 78.56,88.33C79.58,89.41 82.00,92.58 82.00,92.85C82.00,92.92 82.32,93.20 82.71,93.47C83.10,93.74 83.76,94.39 84.17,94.92C86.29,97.63 88.01,99.50 88.39,99.50C88.50,99.50 88.93,98.99 89.33,98.38C89.74,97.76 90.38,96.84 90.76,96.33C91.14,95.83 91.58,95.15 91.74,94.83C92.10,94.11 92.99,92.78 94.08,91.30C94.54,90.69 95.14,89.82 95.41,89.38C95.69,88.94 96.15,88.32 96.43,88.00C96.72,87.68 97.08,87.19 97.23,86.92C97.38,86.64 97.77,86.08 98.08,85.67C98.40,85.25 98.92,84.53 99.24,84.06C99.84,83.16 100.55,82.41 102.39,80.75C103.00,80.20 103.68,79.46 103.90,79.11C104.79,77.68 109.45,72.46 111.12,71.02C111.70,70.53 112.17,70.06 112.17,69.97C112.17,69.88 112.98,68.97 113.98,67.95C114.98,66.92 116.09,65.66 116.44,65.14C117.12,64.13 121.93,59.15 123.57,57.75C124.63,56.85 125.22,56.34 126.01,55.62C126.60,55.08 127.10,55.03 127.25,55.50C127.38,55.92 127.61,55.93 127.82,55.52C127.96,55.27 127.92,55.15 127.62,54.94C127.26,54.68 127.26,54.67 127.56,54.43C127.79,54.25 127.96,54.23 128.19,54.34C128.59,54.56 129.32,54.19 130.42,53.20C130.88,52.79 131.53,52.28 131.87,52.06C132.21,51.85 133.44,50.75 134.62,49.62C135.79,48.49 137.03,47.39 137.37,47.19C137.71,46.98 138.29,46.45 138.67,45.99C139.36,45.17 140.17,44.85 140.17,45.41C140.17,45.83 140.52,45.88 141.01,45.52C141.27,45.33 141.56,45.17 141.64,45.17C141.79,45.17 142.23,44.84 143.90,43.50C144.30,43.18 145.02,42.69 145.49,42.42C145.96,42.14 146.78,41.59 147.30,41.19C147.82,40.79 148.66,40.26 149.17,40.00C149.67,39.74 150.37,39.30 150.73,39.02C151.42,38.47 152.01,38.38 152.62,38.72C152.98,38.92 152.96,38.94 152.02,39.70C151.49,40.13 150.67,40.86 150.19,41.33C149.71,41.79 149.23,42.17 149.12,42.17C149.01,42.17 148.50,42.56 148.00,43.03C147.14,43.84 147.11,43.91 147.48,43.97C147.72,44.00 148.09,43.88 148.39,43.65C148.67,43.45 149.12,43.23 149.41,43.18C149.71,43.11 149.98,42.92 150.08,42.69C150.22,42.38 150.36,42.32 150.89,42.36C151.35,42.39 151.60,42.32 151.74,42.12C151.86,41.96 152.11,41.83 152.30,41.83C152.48,41.83 153.20,41.46 153.89,40.99C154.58,40.53 155.69,39.93 156.36,39.65C157.04,39.38 157.81,38.94 158.08,38.68C158.57,38.22 159.79,37.41 161.05,36.69C161.74,36.30 162.40,36.24 163.08,36.50C163.56,36.68 163.51,37.00 163.00,37.00C162.61,37.00 161.09,38.29 160.56,39.07C160.25,39.53 160.21,39.67 160.40,39.67C160.54,39.67 160.70,39.59 160.76,39.49C160.94,39.19 161.55,39.04 162.03,39.18C162.39,39.28 162.61,39.21 163.11,38.82C163.82,38.29 164.35,38.21 164.67,38.58C164.95,38.93 165.48,38.90 166.13,38.50C166.91,38.02 167.47,38.06 167.60,38.60C167.72,39.08 167.49,39.33 165.90,40.41C165.44,40.72 164.20,41.81 163.15,42.83C159.05,46.81 157.87,47.93 157.44,48.22C157.20,48.38 157.00,48.62 157.00,48.74C157.00,49.23 156.29,50.52 155.87,50.79C154.68,51.54 152.71,53.55 151.43,55.32C151.16,55.70 150.84,56.00 150.71,56.00C150.40,56.00 150.26,56.46 150.49,56.74C150.86,57.19 149.66,58.67 147.16,60.83C146.48,61.42 145.39,62.40 144.75,63.00C144.11,63.59 143.24,64.39 142.83,64.77C142.42,65.14 141.55,66.00 140.89,66.68C140.23,67.36 139.31,68.28 138.85,68.72C137.92,69.61 137.83,69.82 138.33,69.95C138.76,70.06 138.79,69.97 137.92,71.33C137.50,71.98 137.17,72.54 137.17,72.59C137.17,72.64 136.75,73.16 136.25,73.76C135.75,74.35 135.33,74.90 135.33,74.97C135.33,75.05 134.92,75.63 134.41,76.26C133.91,76.90 133.36,77.64 133.21,77.92C133.05,78.19 132.28,79.06 131.50,79.84C130.72,80.63 129.80,81.72 129.46,82.26C128.64,83.55 128.59,83.61 127.45,84.56C126.74,85.16 126.35,85.66 125.99,86.42C125.65,87.13 125.24,87.67 124.71,88.11C123.49,89.10 123.38,89.24 123.10,90.21C122.89,90.96 122.61,91.35 121.63,92.35C120.33,93.67 119.87,94.25 119.35,95.17C119.17,95.49 118.68,96.15 118.26,96.64C117.84,97.13 117.50,97.62 117.50,97.74C117.50,97.85 117.06,98.34 116.51,98.81C115.80,99.43 115.45,99.89 115.24,100.46C115.08,100.89 114.71,101.51 114.41,101.83C113.63,102.69 112.52,104.21 111.63,105.65C111.20,106.34 110.77,106.94 110.67,106.97C110.57,107.00 110.33,107.34 110.14,107.72C109.95,108.10 109.61,108.63 109.39,108.89C109.18,109.15 109.00,109.44 109.00,109.55C109.00,109.77 107.90,111.38 106.92,112.60C106.55,113.06 105.69,114.37 105.01,115.51C104.34,116.65 103.65,117.78 103.49,118.02C103.32,118.26 103.07,118.75 102.92,119.10C102.77,119.46 102.48,119.94 102.27,120.17C102.06,120.40 101.80,120.88 101.70,121.25C101.57,121.71 101.35,122.02 101.00,122.22C100.72,122.39 100.34,122.84 100.15,123.22C99.95,123.60 99.70,124.03 99.58,124.17C99.47,124.30 99.00,125.13 98.54,126.00C97.93,127.18 97.55,127.70 97.06,128.03C96.63,128.32 96.33,128.71 96.14,129.19L95.87,129.92L90.10,129.96L84.32,130.00L84.07,129.38Z"></path></svg>
</div>
</div>
<p style={{ margin: "64px 0 16px", fontSize: "15px", fontWeight: "600", color: "#5B667A" }}>To measure</p>
<div className="meas">
<div className="card" style={{ padding: "24px" }}><div className="ic" style={{ background: "#EAF6E2" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B7A1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M8 12.5l2.8 2.8L16 10"></path></svg></div><div style={{ marginTop: "18px", fontSize: "19px", fontWeight: "800" }}>Successful renewals</div></div>
<div className="card" style={{ padding: "24px" }}><div className="ic" style={{ background: "#FDECEC" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D92D20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12h6M15 12h6M9 8v8M15 8v8"></path></svg></div><div style={{ marginTop: "18px", fontSize: "19px", fontWeight: "800" }}>Benefit gaps</div></div>
<div className="card" style={{ padding: "24px" }}><div className="ic" style={{ background: "#E8F1FE" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A7CF0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path></svg></div><div style={{ marginTop: "18px", fontSize: "19px", fontWeight: "800" }}>Staff time</div></div>
</div>
<div style={{ marginTop: "40px", display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center" }}>
<a className="btn btn-n" href="mailto:support@bene-watch.com?subject=Pennsylvania%20pilot">Interested? Let&apos;s talk <span style={{ color: "#F2A24A" }}>bene-watch.com</span></a>
<a className="btn btn-b" href="mailto:support@bene-watch.com?subject=Bene-Watch%20demonstration">Arrange a demonstration</a>
</div>
</div>
</section>

{/* 8 · CLOSING */}
<section className="light" style={{ borderTop: "1px solid rgba(17,27,46,.06)" }}>
<div className="wrap" style={{ paddingTop: "120px", paddingBottom: "120px", textAlign: "center" }}>
<img src="/landing/logo.png" alt="Bene-Watch" style={{ height: "clamp(56px, 7vw, 92px)", width: "auto", display: "inline-block" }} />
<p style={{ margin: "26px 0 0", fontSize: "clamp(26px, 3vw, 40px)", fontWeight: "800", letterSpacing: "-.025em", color: "#0F2F5F" }}>Keeping <span style={{ color: "#E78A15" }}>PA</span> Connected</p>
<div style={{ marginTop: "36px", display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
<Link className="btn btn-n" href={startHref}>{startLabel}</Link>
<a className="btn btn-b" href="#pilot">Become a pilot partner</a>
</div>
</div>
</section>

{/* FOOTER */}
<footer style={{ background: "#FFFFFF", paddingTop: "80px", paddingBottom: "48px" }}>
<div className="wrap">
<div className="foot">
<div>
<img src="/landing/logo.png" alt="Bene-Watch" style={{ height: "40px", width: "auto", display: "block" }} />
<p style={{ margin: "22px 0 0", maxWidth: "340px", fontSize: "15px", lineHeight: "1.6", color: "#5B667A" }}>The benefit-continuity watchdog for households, caregivers and the organizations that support them.</p>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<span className="cap" style={{ fontSize: "11px", color: "#8A94A6" }}>Product</span>
<a style={{ fontSize: "15px", textDecoration: "none" }} href="#families">How it helps</a>
<a style={{ fontSize: "15px", textDecoration: "none" }} href="#solution">Benefits covered</a>
<a style={{ fontSize: "15px", textDecoration: "none" }} href="#pilot">Pilot</a>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<span className="cap" style={{ fontSize: "11px", color: "#8A94A6" }}>Company</span>
<Link style={{ fontSize: "15px", textDecoration: "none" }} href="/about">About</Link>
<Link style={{ fontSize: "15px", textDecoration: "none" }} href="/resources">Resources</Link>
<a style={{ fontSize: "15px", textDecoration: "none" }} href="mailto:support@bene-watch.com">Contact</a>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<span className="cap" style={{ fontSize: "11px", color: "#8A94A6" }}>Legal</span>
<Link style={{ fontSize: "15px", textDecoration: "none" }} href="/legal/privacy">Privacy</Link>
<Link style={{ fontSize: "15px", textDecoration: "none" }} href="/legal/terms">Terms</Link>
<Link style={{ fontSize: "15px", textDecoration: "none" }} href="/legal/security">Security</Link>
<Link style={{ fontSize: "15px", textDecoration: "none" }} href="/legal/data-retention">Data retention</Link>
</div>
</div>
<div style={{ marginTop: "72px", paddingTop: "32px", borderTop: "1px solid rgba(17,27,46,.1)" }}>
<p style={{ margin: "0", fontSize: "13px", lineHeight: "1.7", color: "#5B667A" }}>Bene-Watch is not a government agency, eligibility system, law firm, tax adviser, financial adviser, medical adviser or official benefits representative. Bene-Watch does not guarantee eligibility, benefit approval, renewal or continued coverage. The platform is designed to help users organize information, identify risk, preserve records and prepare for timely follow-up with the appropriate agency, adviser or representative.</p>
<p style={{ margin: "12px 0 0", fontSize: "13px", lineHeight: "1.7", color: "#5B667A" }}>Photos are for illustrative purposes and show models, not Bene-Watch users.</p>
</div>
<div style={{ marginTop: "28px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "12px", fontSize: "13px", color: "#5B667A" }}>
<span>© 2026 Bene-Watch is a brand of P3 Development Partners LLC | Bene-Watch.com</span>
<span>Works alongside official systems. Does not determine eligibility, provide legal advice or guarantee benefit continuation.</span>
</div>
</div>
</footer>

</div>
  );
}
