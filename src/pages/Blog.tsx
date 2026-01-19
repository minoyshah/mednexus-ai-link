import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Blog = () => {
  const posts = [
    {
      title: "The Future of Medical Professional Networks",
      excerpt: "How verification-first platforms are transforming the way healthcare professionals connect and collaborate.",
      author: "Dr. Sarah Chen",
      date: "January 15, 2026",
      category: "Industry Insights",
    },
    {
      title: "Why Credential Verification Matters in Healthcare",
      excerpt: "Exploring the critical importance of verifying professional credentials in the digital age of medicine.",
      author: "Dr. Michael Torres",
      date: "January 10, 2026",
      category: "Trust & Safety",
    },
    {
      title: "AI in Medical Education: Opportunities and Challenges",
      excerpt: "How artificial intelligence is revolutionizing medical education and what it means for future physicians.",
      author: "Dr. Emily Watson",
      date: "January 5, 2026",
      category: "Technology",
    },
    {
      title: "Building Meaningful Connections Across Specialties",
      excerpt: "Tips and strategies for medical professionals looking to expand their network beyond their specialty.",
      author: "James Park",
      date: "December 28, 2025",
      category: "Networking",
    },
    {
      title: "HIPAA Compliance in Professional Networking",
      excerpt: "Best practices for maintaining patient privacy while engaging in professional networking activities.",
      author: "Legal Team",
      date: "December 20, 2025",
      category: "Compliance",
    },
    {
      title: "From Resident to Attending: Career Transitions",
      excerpt: "Navigating the challenging transition from residency to attending physician with the right network support.",
      author: "Dr. Sarah Chen",
      date: "December 15, 2025",
      category: "Career",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">MedNet Blog</h1>
          <p className="text-xl text-muted-foreground">
            Insights, updates, and resources for medical professionals.
          </p>
        </div>

        {/* Featured Post */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 mb-12 border border-primary/20">
          <span className="text-sm font-medium text-primary">{posts[0].category}</span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-2 mb-4">{posts[0].title}</h2>
          <p className="text-muted-foreground mb-6">{posts[0].excerpt}</p>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {posts[0].author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {posts[0].date}
              </span>
            </div>
            <Button className="gap-2">
              Read Article
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.slice(1).map((post) => (
            <article 
              key={post.title} 
              className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors"
            >
              <div className="p-6">
                <span className="text-xs font-medium text-primary">{post.category}</span>
                <h3 className="font-semibold text-foreground text-lg mt-2 mb-3">{post.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{post.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {post.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {post.date}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-16 text-center p-12 bg-muted/50 rounded-2xl">
          <h2 className="text-2xl font-bold text-foreground mb-4">Subscribe to Our Newsletter</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Get the latest insights and updates delivered directly to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground"
            />
            <Button>Subscribe</Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Blog;
