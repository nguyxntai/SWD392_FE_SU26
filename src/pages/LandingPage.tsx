import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Sparkles, Shield, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { Navigation } from "../components/Navigation";

export default function LandingPage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Discover Amazing Products",
      description: "Find the best products curated just for you",
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop",
    },
    {
      title: "Quality Guaranteed",
      description: "Premium products with guaranteed quality",
      image:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop",
    },
    {
      title: "Fast & Secure",
      description: "Quick delivery and secure transactions",
      image:
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=600&fit=crop",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const features = [
    {
      icon: Sparkles,
      title: "Premium Quality",
      description: "Carefully selected products with top quality standards",
    },
    {
      icon: Shield,
      title: "Secure Shopping",
      description: "Your data and transactions are always protected",
    },
    {
      icon: Zap,
      title: "Fast Delivery",
      description: "Quick and reliable shipping to your doorstep",
    },
  ];

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <Navigation />

      {/* HERO */}
      <section className="relative h-[600px] overflow-hidden pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <ImageWithFallback
              src={slides[currentSlide].image}
              alt={slides[currentSlide].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>
        </AnimatePresence>

        <div className="relative h-full flex items-center justify-center text-center text-white">
          <motion.div
            className="max-w-4xl px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl font-bold mb-4">
              {slides[currentSlide].title}
            </h1>
            <p className="text-xl mb-8">
              {slides[currentSlide].description}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/products")}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary/90 transition"
            >
              Explore Products
            </motion.button>
          </motion.div>
        </div>

        {/* Controls */}
        <button
          onClick={() =>
            setCurrentSlide(
              (prev) => (prev - 1 + slides.length) % slides.length
            )
          }
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full"
        >
          <ChevronLeft />
        </button>

        <button
          onClick={() =>
            setCurrentSlide((prev) => (prev + 1) % slides.length)
          }
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full"
        >
          <ChevronRight />
        </button>
      </section>

      {/* FEATURES */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            Why Choose Us
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  whileHover={{ y: -6 }}
                  className="bg-background p-8 rounded-lg shadow-sm hover:shadow-md text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto px-4 text-center"
        >
          <h2 className="text-3xl font-bold mb-6">
            Ready to Start Shopping?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of satisfied customers today
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/products")}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold"
            >
              Browse Products
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/signup")}
              className="border border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-primary-foreground transition"
            >
              Sign Up Now
            </motion.button>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
}
