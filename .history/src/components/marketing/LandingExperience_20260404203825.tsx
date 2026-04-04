"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Active Learners", value: "12,400+" },
  { label: "Career Promotions", value: "3,170" },
  { label: "Avg. Course Rating", value: "4.9/5" },
  { label: "Global Cities", value: "42" }
];

const features = [
  {
    title: "Guided Learning Paths",
    description: "Curated tracks that move from foundational thinking to advanced execution.",
    accent: "from-amber-300/40 to-orange-500/20"
  },
  {
    title: "Elite Mentor Layer",
    description: "Weekly mentor office-hours and decision frameworks from real operators.",
    accent: "from-sky-300/40 to-cyan-500/20"
  },
  {
    title: "Outcomes Dashboard",
    description: "Progress, momentum, and skill proof mapped to your real goals.",
    accent: "from-emerald-300/40 to-teal-500/20"
  }
];

const testimonials = [
  {
    name: "Ariana Knox",
    role: "Product Lead, Berlin",
    quote:
      "LearnHub gave me a structure I never had. I stopped collecting courses and started shipping strategic work each week."
  },
  {
    name: "Nikhil Menon",
    role: "Senior Engineer, Dubai",
    quote:
      "The Core path is sharp, practical, and ruthless about signal. I used the frameworks in interviews and landed a better role."
  },
  {
    name: "Maya Chen",
    role: "Founder, Singapore",
    quote:
      "Pro tier mentorship paid for itself in one quarter. We tightened execution and improved team communication immediately."
  }
];

const studentReviews = [
  {
    student: "Lina R.",
    result: "Promoted to Group PM in 6 months",
    review: "The weekly cadence and templates finally made me consistent."
  },
  {
    student: "Omar K.",
    result: "Moved from IC to Team Lead",
    review: "Lessons are concise but deep. The system keeps you accountable."
  },
  {
    student: "Jules A.",
    result: "Built side-business to first $10k MRR",
    review: "I followed the execution framework exactly. It worked."
  }
];

const fadeInUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.55 }
};

export function LandingExperience() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_12%_20%,rgba(248,187,82,0.18),transparent_42%),radial-gradient(circle_at_88%_16%,rgba(45,180,191,0.2),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(40,120,200,0.15),transparent_38%)]" />

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-20 pt-14 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <Badge className="bg-secondary/90">LearnHub Premium Track</Badge>
          <h1 className="mt-5 text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Build rare skills with a system designed for serious learners.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            LearnHub combines premium coursework, tactical mentorship, and execution routines so your progress is measurable,
            visible, and career-defining.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup">
              <Button size="lg">Start Learning Today</Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="secondary">
                Compare Plans
              </Button>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 * index, duration: 0.45 }}
                className="rounded-xl border border-border/60 bg-card/65 p-3 backdrop-blur"
              >
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="relative rounded-2xl border border-border/70 bg-card/80 p-6 backdrop-blur"
        >
          <div className="absolute inset-0 -z-10 rounded-2xl bg-linear-to-br from-secondary/20 via-transparent to-primary/20" />
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Learning Pulse</p>
          <h2 className="mt-2 text-2xl font-semibold">Your momentum, visualized daily.</h2>
          <div className="mt-6 space-y-3">
            {[91, 76, 88, 64].map((score, i) => (
              <div key={score + i}>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Track {i + 1}</span>
                  <span>{score}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full bg-linear-to-r from-secondary to-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.8, delay: 0.15 * i }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20">
        <motion.div {...fadeInUp}>
          <h3 className="text-3xl font-bold">What makes LearnHub different</h3>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Designed for professionals who need visible outcomes, not infinite content consumption.
          </p>
        </motion.div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {features.map((feature, idx) => (
            <motion.div key={feature.title} {...fadeInUp} transition={{ duration: 0.45, delay: idx * 0.08 }}>
              <Card className="h-full overflow-hidden">
                <div className={`h-1.5 w-full bg-linear-to-r ${feature.accent}`} />
                <CardHeader>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20">
        <motion.div {...fadeInUp}>
          <h3 className="text-3xl font-bold">Testimonials</h3>
          <p className="mt-3 text-muted-foreground">Stories from high-performers scaling their impact.</p>
        </motion.div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {testimonials.map((item, idx) => (
            <motion.div key={item.name} {...fadeInUp} transition={{ duration: 0.5, delay: idx * 0.08 }}>
              <Card className="h-full">
                <CardContent className="space-y-3 p-6">
                  <p className="text-sm leading-relaxed text-foreground/90">"{item.quote}"</p>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-24">
        <motion.div {...fadeInUp}>
          <h3 className="text-3xl font-bold">Student Reviews</h3>
          <p className="mt-3 text-muted-foreground">Recent outcomes from learners across Insider, Core, and Pro.</p>
        </motion.div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {studentReviews.map((review, idx) => (
            <motion.div key={review.student} {...fadeInUp} transition={{ duration: 0.48, delay: idx * 0.08 }}>
              <Card className="h-full border-secondary/30">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">{review.student}</p>
                  <p className="mt-2 text-base font-semibold">{review.result}</p>
                  <p className="mt-2 text-sm text-foreground/90">{review.review}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div {...fadeInUp} className="mt-12 rounded-2xl border border-border bg-card/80 p-8 text-center">
          <h4 className="text-2xl font-bold">Start your next chapter with LearnHub</h4>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Choose your tier, unlock your roadmap, and build momentum with premium learning systems built for real outcomes.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/pricing">
              <Button size="lg">Choose Plan</Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="secondary">
                Create Account
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
