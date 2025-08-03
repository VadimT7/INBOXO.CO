import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Sales Director",
    company: "TechCorp Inc.",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    content: "Inboxo has transformed how we handle leads. Our response time has decreased by 70% and our conversion rate has doubled.",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "Marketing Manager",
    company: "Growth Solutions",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    content: "The AI-powered lead scoring is incredibly accurate. It's like having a virtual sales assistant that never sleeps.",
    rating: 5
  },
  {
    name: "Emma Davis",
    role: "Business Development",
    company: "Innovate Labs",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    content: "Setup was a breeze, and the automated responses feel personal. Our clients can't tell they're not hand-written!",
    rating: 5
  }
];

const TestimonialCard = ({ testimonial, index }: { testimonial: typeof testimonials[0], index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="bg-white rounded-2xl shadow-lg p-8 relative"
    >
      <div className="absolute -top-4 left-8 flex space-x-1">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="w-8 h-8 text-yellow-400 fill-yellow-400" />
        ))}
      </div>
      <div className="mt-6">
        <p className="text-slate-700 text-lg leading-relaxed mb-6">"{testimonial.content}"</p>
        <div className="flex items-center">
          <img
            src={testimonial.image}
            alt={testimonial.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="ml-4">
            <h4 className="font-semibold text-slate-900">{testimonial.name}</h4>
            <p className="text-sm text-slate-600">{testimonial.role}</p>
            <p className="text-sm text-slate-500">{testimonial.company}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            className="text-blue-600 font-semibold text-sm uppercase tracking-wider"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Testimonials
          </motion.span>
          <motion.h2
            className="mt-2 text-4xl font-bold text-slate-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Loved by Sales Teams Everywhere
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-slate-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            See what our customers have to say about their experience with Inboxo
          </motion.p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection; 