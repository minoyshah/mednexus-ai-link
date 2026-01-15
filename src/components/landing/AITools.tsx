import { Brain, BookOpen, Target, Lightbulb, Clock, BarChart3, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const AITools = () => {
  const aiFeatures = [
    {
      icon: MessageCircle,
      title: "Medical Q&A Bot",
      description: "Ask clinical questions and receive evidence-based answers with citations from verified sources.",
    },
    {
      icon: BookOpen,
      title: "AAMC-Style Questions",
      description: "AI-generated practice questions mimicking MCAT, USMLE, and shelf exam formats.",
    },
    {
      icon: Target,
      title: "Adaptive Difficulty",
      description: "Questions automatically adjust based on your performance and learning patterns.",
    },
    {
      icon: Lightbulb,
      title: "Detailed Rationales",
      description: "Every question includes comprehensive explanations for correct and incorrect options.",
    },
    {
      icon: Clock,
      title: "Timed Practice Mode",
      description: "Simulate real exam conditions with timed blocks and post-session analytics.",
    },
    {
      icon: BarChart3,
      title: "Weakness Tracking",
      description: "AI identifies knowledge gaps and recommends targeted review topics.",
    },
  ];

  return (
    <section id="ai-tools" className="py-24 bg-background relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              <Brain className="w-3.5 h-3.5" />
              AI-Powered Learning
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Study Smarter with Medical AI
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              From medical school to board certification, MedNet's AI engine adapts to your role 
              and learning style. Generate practice questions, get instant explanations, and track 
              your progress—all within the verified ecosystem.
            </p>

            {/* AI Demo Card */}
            <div className="p-6 rounded-xl bg-card border border-border mb-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Example Question</p>
                  <p className="text-foreground font-medium mb-4">
                    "A 65-year-old patient presents with chest pain radiating to the left arm. 
                    ECG shows ST elevation in leads V1-V4. What is the most likely diagnosis?"
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-secondary text-sm text-foreground">A. NSTEMI</span>
                    <span className="px-3 py-1 rounded-full bg-trust/20 text-sm text-trust font-medium border border-trust/30">B. Anterior STEMI ✓</span>
                    <span className="px-3 py-1 rounded-full bg-secondary text-sm text-foreground">C. Stable Angina</span>
                    <span className="px-3 py-1 rounded-full bg-secondary text-sm text-foreground">D. Pericarditis</span>
                  </div>
                </div>
              </div>
            </div>

            <Button variant="default" size="lg">
              Try AI Study Tools
            </Button>
          </div>

          {/* Right: Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {aiFeatures.map((feature) => (
              <div 
                key={feature.title}
                className="p-5 rounded-xl bg-card border border-border hover:border-accent/30 transition-all duration-300"
              >
                <feature.icon className="w-6 h-6 text-accent mb-3" />
                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Role-Aware Responses */}
        <div className="mt-20 grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-accent/5 border border-accent/20">
            <div className="text-sm font-medium text-accent mb-2">For Medical Students</div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Teaching-Style Explanations</h4>
            <p className="text-muted-foreground text-sm">
              AI responses include foundational concepts, step-by-step reasoning, and study 
              tips tailored to your level of training.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-trust/5 border border-trust/20">
            <div className="text-sm font-medium text-trust mb-2">For Attending Physicians</div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Evidence-Focused Summaries</h4>
            <p className="text-muted-foreground text-sm">
              Get concise, evidence-based answers with direct citations to guidelines, 
              recent trials, and clinical relevance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AITools;
