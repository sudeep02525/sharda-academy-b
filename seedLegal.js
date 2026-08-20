import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CmsContent from './models/CmsContent.js';

dotenv.config();

const privacySections = [
  {
    id: "1",
    title: "1. Introduction",
    icon: "FileText",
    content: "<p>Welcome to Sharda Academy. We respect your privacy and are committed to protecting your personal data. This Privacy Policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) or use our educational services.</p><blockquote><strong>Note:</strong> This policy is strictly compliant with applicable Indian laws, including the Digital Personal Data Protection (DPDP) Act.</blockquote>"
  },
  {
    id: "2",
    title: "2. Information We Collect",
    icon: "Server",
    content: "<p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p><ul><li><strong>Identity Data:</strong> First name, last name, username, title, date of birth.</li><li><strong>Contact Data:</strong> Billing address, email address, and telephone numbers.</li><li><strong>Academic Data:</strong> Educational records, transcripts, examination scores.</li><li><strong>Financial Data:</strong> Payment details (processed securely via gateways).</li></ul>"
  },
  {
    id: "3",
    title: "3. How We Use Information",
    icon: "Settings",
    content: "<p>Most commonly, we will use your personal data in the following circumstances:</p><ol><li>To perform the contract we are about to enter into or have entered into with you (e.g., enrolling you in a course).</li><li>To manage our relationship with you, including notifying you about changes to our terms or privacy policy.</li><li>To administer and protect our business and this website (troubleshooting, data analysis, system maintenance).</li><li>To deliver relevant educational content and updates to you securely.</li></ol>"
  },
  {
    id: "4",
    title: "4. Data Sharing & Disclosure",
    icon: "Share2",
    content: "<p>We do not sell your personal data to third parties. We may share your data with the parties set out below for the purposes outlined in this policy:</p><ul><li><strong>Service Providers:</strong> Acting as processors based in India who provide IT and system administration services, payment processing, and email communication services.</li><li><strong>Regulatory Authorities:</strong> Relevant government bodies, regulators, and other authorities in India who require reporting of processing activities in certain circumstances.</li></ul>"
  },
  {
    id: "5",
    title: "5. Data Security",
    icon: "Lock",
    content: "<p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.</p>"
  },
  {
    id: "6",
    title: "6. Your Privacy Rights",
    icon: "UserCheck",
    content: "<p>Under certain circumstances, you have rights under data protection laws in relation to your personal data. These include the right to request access, request correction, request erasure, object to processing, and withdraw consent.</p>"
  },
  {
    id: "7",
    title: "7. Cookies & Tracking",
    icon: "Eye",
    content: "<p>You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this website may become inaccessible or not function properly.</p>"
  }
];

const termsSections = [
  {
    id: "1",
    title: "1. Acceptance of Terms",
    icon: "Handshake",
    content: "<p>By accessing the Sharda Academy website, registering for an account, or enrolling in any of our courses, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our services.</p><p>These terms constitute a legally binding agreement between you and Sharda Academy. We reserve the right to modify these terms at any time without prior notice. Your continued use of our services implies acceptance of the updated terms.</p>"
  },
  {
    id: "2",
    title: "2. Admissions & Enrollment",
    icon: "FileSignature",
    content: "<p>Enrollment in Sharda Academy courses is subject to availability and the fulfillment of eligibility criteria specific to each course.</p><ul><li><strong>Accurate Information:</strong> Applicants must provide authentic verifiable information.</li><li><strong>Right of Rejection:</strong> Sharda Academy reserves the right to reject applications.</li><li><strong>Non-Transferable:</strong> Enrollment is strictly personal and non-transferable.</li></ul>"
  },
  {
    id: "3",
    title: "3. Fees & Refunds",
    icon: "Landmark",
    content: "<p>All course fees must be paid in full prior to the commencement of the course unless a specialized installment plan has been explicitly agreed upon in writing.</p><blockquote><strong>Refund Policy:</strong><ul><li>Fees once paid are generally non-refundable.</li><li>If a student withdraws before the batch starts, a partial refund may be issued subject to an administrative deduction.</li><li>No refunds will be entertained once the batch has commenced.</li></ul></blockquote>"
  },
  {
    id: "4",
    title: "4. Code of Conduct",
    icon: "Users",
    content: "<p>Students are expected to maintain high standards of discipline, respect, and academic integrity.</p><ol><li>Harassment, bullying, or discrimination of any kind towards faculty, staff, or fellow students is strictly prohibited.</li><li>Students must attend classes regularly and adhere to the schedules provided.</li><li>Any form of cheating, plagiarism, or academic misconduct will lead to strict disciplinary action, including potential expulsion without refund.</li></ol>"
  },
  {
    id: "5",
    title: "5. Intellectual Property",
    icon: "Lightbulb",
    content: "<p>All study materials, lecture videos, notes, assignments, and resources provided by Sharda Academy are the exclusive intellectual property of the academy.</p><p>These materials are provided solely for personal educational use. Students are expressly prohibited from copying, distributing, selling, or uploading any academy materials to third-party platforms. Any violation of this clause will result in immediate termination of enrollment and potential legal action.</p>"
  },
  {
    id: "6",
    title: "6. Limitation of Liability",
    icon: "AlertTriangle",
    content: "<p>Sharda Academy makes every effort to ensure the accuracy and quality of its educational content. However, we do not guarantee specific outcomes, exam results, or placements.</p><p>In no event shall Sharda Academy, its directors, employees, or faculty be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with the use of our services or educational materials.</p>"
  },
  {
    id: "7",
    title: "7. Termination",
    icon: "Gavel",
    content: "<p>Sharda Academy reserves the right to suspend or terminate your enrollment and access to services, without refund, if you breach any of these Terms & Conditions or engage in conduct deemed detrimental to the academy's reputation or learning environment.</p>"
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  await CmsContent.findOneAndUpdate(
    { page: 'legal', section: 'privacy' },
    { data: { sections: privacySections }, isPublished: true },
    { upsert: true, new: true }
  );

  await CmsContent.findOneAndUpdate(
    { page: 'legal', section: 'terms' },
    { data: { sections: termsSections }, isPublished: true },
    { upsert: true, new: true }
  );

  console.log('Seeded legal pages with standard Quill HTML');
  process.exit(0);
}

seed();
