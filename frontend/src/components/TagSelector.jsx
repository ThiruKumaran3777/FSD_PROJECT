import React from 'react';

const TAGS = [
    "Too Fast", "Too Slow", "Too Technical", "Not Enough Examples",
    "Great Example", "Engaging", "Confusing", "Clear Explanation"
];

const TagSelector = ({ selectedTags, onChange }) => {
    const toggleTag = (tag) => {
        if (selectedTags.includes(tag)) {
            onChange(selectedTags.filter((t) => t !== tag));
        } else {
            if (selectedTags.length < 3) {
                onChange([...selectedTags, tag]);
            }
        }
    };

    return (
        <div className="flex flex-wrap gap-2 justify-center">
            {TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                    <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wide border-2 transition-all ${isSelected
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'
                            }`}
                    >
                        {tag}
                    </button>
                );
            })}
        </div>
    );
};

export default TagSelector;
