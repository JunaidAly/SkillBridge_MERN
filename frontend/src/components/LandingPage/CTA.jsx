import Button from '../../ui/Button.jsx';
import { ArrowRight } from 'lucide-react';

function CTA() {
  return (
    <section className="py-20 bg-white font-family-poppins">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-blue rounded-2xl px-8 py-16 flex flex-col items-center text-center">
          <h2 className="text-4xl md:text-5xl font-medium text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg font-medium text-white/90 max-w-2xl mb-8">
            Join SkillBridge today and connect with global community of learners and mentors.
          </p>
          <Button
            variant="primary"
            className="px-8 py-3 text-lg font-medium flex items-center gap-2"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export default CTA;
