import CmsContent from '../models/CmsContent.js';

// @desc    Get content for a specific page and section
// @route   GET /cms/:page/:section
// @access  Public
export const getContent = async (req, res) => {
  try {
    const { page, section } = req.params;

    if (!page || !section) {
      return res.status(400).json({ message: 'Page and section are required' });
    }

    const content = await CmsContent.findOne({ page, section });

    if (!content) {
      return res.status(200).json({ data: null, message: 'Content not found' });
    }

    res.status(200).json(content);
  } catch (error) {
    console.error('Error in getContent:', error);
    res.status(500).json({ message: 'Server error fetching content', error: error.message });
  }
};

// @desc    Create or update content for a specific page and section
// @route   PUT /cms/:page/:section
// @access  Private (Admin)
export const updateContent = async (req, res) => {
  try {
    const { page, section } = req.params;
    const { data, isPublished } = req.body;

    if (!page || !section) {
      return res.status(400).json({ message: 'Page and section are required' });
    }

    if (!data) {
      return res.status(400).json({ message: 'Data is required' });
    }

    // Backend validation for testimonials
    if (section === 'testimonials' && Array.isArray(data.testimonials)) {
      for (let i = 0; i < data.testimonials.length; i++) {
        const t = data.testimonials[i];
        
        // Rating validation
        const rating = Number(t.rating);
        if (isNaN(rating) || rating < 1 || rating > 5) {
          return res.status(400).json({ message: `Testimonial at index ${i} must have a rating between 1 and 5.` });
        }
        
        // Display Order validation
        const order = Number(t.displayOrder);
        if (isNaN(order) || !Number.isInteger(order) || order <= 0) {
          return res.status(400).json({ message: `Testimonial at index ${i} must have a positive integer for Display Order.` });
        }
        
        // isActive validation
        if (typeof t.isActive !== 'boolean') {
          return res.status(400).json({ message: `Testimonial at index ${i} must have a boolean isActive status.` });
        }
      }
    }

    // Using findOneAndUpdate with upsert: true
    // This will update the document if it exists, or create a new one if it doesn't.
    const updatedContent = await CmsContent.findOneAndUpdate(
      { page, section },
      { 
        $set: { 
          data, 
          isPublished: isPublished !== undefined ? isPublished : true 
        } 
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(updatedContent);
  } catch (error) {
    console.error('Error in updateContent:', error);
    res.status(500).json({ message: 'Server error updating content', error: error.message });
  }
};
