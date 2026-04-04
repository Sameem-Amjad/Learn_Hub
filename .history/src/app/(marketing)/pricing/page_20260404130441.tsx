"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  { key: "insider", name: "Insider", monthly: 29, description: "Basic course access" },
  { key: "core", name: "Core", monthly: 79, description: "Basic + intermediate + books" },
  { key: "pro", name: "Pro", monthly: 199, description: "Everything + 1-on-1 sessions" }
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">Choose your tier</h1>
        <button className="rounded-full border border-border px-4 py-2 text-sm" onClick={() => setYearly((v) => !v)}>
          {yearly ? "Yearly billing" : "Monthly billing"}
        </button>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const price = yearly ? Math.round(plan.monthly * 10.8) : plan.monthly;
          return (
            <Card key={plan.key} className={plan.key === "pro" ? "border-primary" : undefined}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">${price}</p>
                <p className="mt-1 text-xs text-muted-foreground">per month</p>
                <p className="mt-4 text-sm text-muted-foreground">{plan.description}</p>
                <Button className="mt-6 w-full">Subscribe</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
