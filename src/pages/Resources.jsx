import React from 'react';

const Resources = () => {
  const resources = [
    {
      category: "Crisis Support",
      items: [
        {
          title: "National Crisis Hotline",
          description: "24/7 emergency support - Call 988",
          link: "tel:988"
        },
        {
          title: "Crisis Text Line",
          description: "Text HOME to 741741",
          link: "sms:741741"
        }
      ]
    },
    {
      category: "Self-Help Resources",
      items: [
        {
          title: "Mindfulness Exercises",
          description: "Guided meditation and breathing techniques",
          link: "/resources/mindfulness"
        },
        {
          title: "Stress Management",
          description: "Tips and techniques for managing stress",
          link: "/resources/stress"
        }
      ]
    },
    {
      category: "Educational Content",
      items: [
        {
          title: "Mental Health Articles",
          description: "Latest research and insights",
          link: "/resources/articles"
        },
        {
          title: "Wellness Tips",
          description: "Daily practices for mental well-being",
          link: "/resources/tips"
        }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Mental Health Resources</h1>
      
      <div className="space-y-12">
        {resources.map((section, index) => (
          <div key={index}>
            <h2 className="text-2xl font-semibold mb-6">{section.category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {section.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="bg-white rounded-lg shadow-lg p-6"
                >
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600 mb-4">{item.description}</p>
                  <a
                    href={item.link}
                    className="text-indigo-600 font-medium hover:text-indigo-700"
                  >
                    Learn More →
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Resources;
