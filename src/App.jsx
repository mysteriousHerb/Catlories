import React, { useState, useMemo, useEffect } from 'react';

// --- Helper Functions & Constants ---

// NEW: Predefined food library
const FOOD_LIBRARY = [
  { id: 'katkin_cluck', name: 'Katkin Cluck', protein: 17.1, fat: 6.5, fibre: 0, ash: 1.9, moisture: 74.6 },
  { id: 'katkin_moo', name: 'Katkin Moo', protein: 17.2, fat: 10.2, fibre: 0.3, ash: 2.2, moisture: 69.4 },
  { id: 'katkin_gobble', name: 'Katkin Gobble', protein: 18.1, fat: 4.2, fibre: 0.2, ash: 1.6, moisture: 75.1 },
  { id: 'katkin_baa', name: 'Katkin Baa', protein: 13.6, fat: 12.6, fibre: 0.1, ash: 2.4, moisture: 70.5 },
  { id: 'katkin_splash', name: 'Katkin Splash', protein: 16.6, fat: 6.8, fibre: 0, ash: 2.3, moisture: 73.3 },
  { id: 'katkin_quack', name: 'Katkin Quack', protein: 18.8, fat: 6.2, fibre: 0.1, ash: 2.2, moisture: 72.8 },
  { id: 'katkin_oink', name: 'Katkin Oink', protein: 17.2, fat: 10.2, fibre: 0.1, ash: 2.4, moisture: 69.9 },
];


// Calculates Kcal per 100g
const calculateKcal = (protein, fat, fibre, ash, moisture) => {
  const proteinNum = parseFloat(protein);
  const fatNum = parseFloat(fat);
  const fibreNum = parseFloat(fibre);
  const ashNum = parseFloat(ash);
  // Default to 8% moisture if not provided
  const moistureNum = moisture === '' ? 8.0 : parseFloat(moisture);

  const sumOfParts = proteinNum + fatNum + fibreNum + ashNum + moistureNum;

  if (sumOfParts > 100.1) {
    // Return an error or a special value if nutrients are > 100
    return { error: `Nutrients add up to ${sumOfParts.toFixed(1)}% (more than 100%).` };
  }

  const carbs = 100 - sumOfParts;

  const kcalFromProtein = proteinNum * 3.5;
  const kcalFromFat = fatNum * 8.5;
  const kcalFromCarbs = carbs * 3.5;

  const totalKcal = kcalFromProtein + kcalFromFat + kcalFromCarbs;
  return { kcal: totalKcal, carbs: carbs };
};

// Calculates Maintenance Energy Requirement (MER)
const calculateMER = (weight, activityLevel) => {
  const weightKg = parseFloat(weight);
  if (isNaN(weightKg) || weightKg <= 0) return { rer: 0, mer: 0 };

  const rer = 70 * Math.pow(weightKg, 0.75);

  let factor = 1.2; // Default
  switch (activityLevel) {
    case 'neutered':
      factor = 1.2; // Neutered adult cat
      break;
    case 'intact':
      factor = 1.4; // Intact adult cat
      break;
    case 'inactive':
      factor = 1.0; // Inactive/obese prone cat
      break;
    case 'weight_loss':
      factor = 0.8; // Weight loss for cat
      break;
    case 'weight_gain':
      factor = 1.8; // Weight gain for cat
      break;
    case 'kitten_young':
      factor = 2.5; // Kitten 0 to 4 months
      break;
    case 'kitten_old':
      factor = 2.0; // Kitten 4 months to 1 year
      break;
    default:
      factor = 1.2; // Default to neutered adult
  }

  const mer = rer * factor;
  return { rer, mer };
};

// --- Utility Components ---

// A generic card component for layout
const Card = ({ title, children, footer }) => (
  <div className="bg-white shadow-xl rounded-2xl overflow-hidden w-full">
    <h3 className="text-xl font-bold text-gray-800 p-6 bg-gray-50 border-b border-gray-200">
      {title}
    </h3>
    <div className="p-6 space-y-4">
      {children}
    </div>
    {footer && (
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        {footer}
      </div>
    )}
  </div>
);

// A generic button component
const Button = ({ onClick, children, className = '', variant = 'primary', disabled = false }) => {
  const baseStyle = 'w-full py-3 px-4 rounded-lg font-semibold text-center transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400',
  };
  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// A styled input component
const Input = ({ label, type, value, onChange, placeholder, min, step, adornment, inputClassName = '', onFocus, onBlur }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        step={step}
        onFocus={onFocus}
        onBlur={onBlur}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 shadow-sm bg-white text-gray-900 ${inputClassName}`}
      />
      {adornment && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-gray-500 sm:text-sm">{adornment}</span>
        </div>
      )}
    </div>
  </div>
);

// A styled slider component
const Slider = ({ label, min, max, value, onChange, style }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      style={{
        background: `linear-gradient(to right, #2563EB 0%, #2563EB ${value}%, #d1d5db ${value}%, #d1d5db 100%)`,
        ...style
      }}
    />
  </div>
);

// --- Main Components ---

// Component for the pop-up message
const Message = ({ message, type, onClose }) => {
  if (!message) return null;
  const colors = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
  };
  return (
    <div className={`fixed top-5 right-5 p-4 border rounded-lg ${colors[type]} shadow-lg z-50`} role="alert">
      <span className="block sm:inline">{message}</span>
      <button onClick={onClose} className="absolute top-0 bottom-0 right-0 px-4 py-3">
        <svg className="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 2.651a1.2 1.2 0 1 1-1.697-1.697L8.18 10 5.53 7.349a1.2 1.2 0 1 1 1.697-1.697L10 8.18l2.651-2.651a1.2 1.2 0 1 1 1.697 1.697L11.819 10l2.651 2.651a1.2 1.2 0 0 1 0 1.698z" /></svg>
      </button>
    </div>
  );
};

// --- Main Components ---
const FoodLibrarySelector = ({ onAddFood, showMessage, currentFoods }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const currentFoodNames = useMemo(() => currentFoods.map(f => f.name), [currentFoods]);

  const filteredLibrary = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    // NEW: If search term is empty, show the full library (that hasn't been added)
    if (!term) {
      return FOOD_LIBRARY.filter(food => !currentFoodNames.includes(food.name));
    }

    // If search term is not empty, filter based on it
    return FOOD_LIBRARY.filter(food => {
      const nameMatch = food.name.toLowerCase().includes(term);
      const notAdded = !currentFoodNames.includes(food.name);
      return nameMatch && notAdded;
    });
  }, [searchTerm, currentFoodNames]);

  const handleAddFromLibrary = (food) => {
    const { protein, fat, fibre, ash, moisture } = food;
    const { kcal, error } = calculateKcal(protein, fat, fibre, ash, moisture);

    if (error) {
      showMessage(`Error calculating Kcal for ${food.name}: ${error}`, 'error');
      return;
    }

    onAddFood({
      id: food.id,
      name: food.name,
      kcalPer100g: kcal,
      // Pass full details
      protein,
      fat,
      fibre,
      ash,
      moisture,
    });
    setShowDropdown(false);
    setSearchTerm('');
    showMessage(`Added "${food.name}" from library`, 'success');
  };

  return (
    <div className="relative space-y-3">
      <Input
        label="Search Library"
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowDropdown(true); // Keep dropdown open while typing
        }}
        placeholder="e.g., 'wet' or 'dry'"
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay blur to allow click
      />
      {/* MODIFICATION 1: Change render condition to just showDropdown */}
      {showDropdown && (
        <div className="absolute z-10 w-full max-h-60 overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-300 mt-1 py-2">
          {/* MODIFICATION 2: Handle empty state inside */}
          {filteredLibrary.length > 0 ? (
            filteredLibrary.map(food => (
              <div
                key={food.id}
                // MODIFICATION 3: Use onMouseDown to register click before blur
                onMouseDown={() => handleAddFromLibrary(food)}
                className="flex justify-between items-center p-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
              >
                <span className="text-gray-800 font-medium">{food.name}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
            ))
          ) : (
            <div className="p-3 text-gray-500 text-center">
              {/* Show different message based on why it's empty */}
              {searchTerm ? "No results found." : "No library items to add."}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Form to add a new food
const FoodForm = ({ onAddFood, showMessage }) => {
  const [name, setName] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [fibre, setFibre] = useState('');
  const [ash, setAsh] = useState('');
  const [moisture, setMoisture] = useState('');
  const [pasteData, setPasteData] = useState('');

  const parsePastedData = (data) => {
    const lines = data.split('\n');
    const keywords = {
      protein: /protein|protéin/i,
      fat: /fat|fat content|matières grasses|grasa/i,
      fibre: /fibre|fiber|cellulose|fibra/i,
      ash: /ash|cendra|cendres|ceniza/i,
      moisture: /moisture|humidité|humedad/i,
    };

    const findValue = (regex) => {
      for (const line of lines) {
        if (regex.test(line)) {
          const match = line.match(/(\d+(\.\d+)?)\s*%/);
          if (match) return match[1];
        }
      }
      return '';
    };

    setProtein(findValue(keywords.protein));
    setFat(findValue(keywords.fat));
    setFibre(findValue(keywords.fibre));
    setAsh(findValue(keywords.ash));
    setMoisture(findValue(keywords.moisture));
  };

  const handlePasteChange = (e) => {
    setPasteData(e.target.value);
    parsePastedData(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const proteinNum = parseFloat(protein);
    const fatNum = parseFloat(fat);
    const fibreNum = parseFloat(fibre);
    const ashNum = parseFloat(ash);
    // FIX: Handle default moisture correctly. Use 8.0 only if the field is empty.
    const moistureNum = moisture === '' ? 8.0 : parseFloat(moisture);

    // FIX: Add moistureNum to the NaN check
    if (!name || isNaN(proteinNum) || isNaN(fatNum) || isNaN(fibreNum) || isNaN(ashNum) || isNaN(moistureNum)) {
      showMessage('Please fill in all food fields correctly.', 'error');
      return;
    }

    const sumOfParts = proteinNum + fatNum + fibreNum + ashNum + moistureNum;

    // Check if the sum is over 100
    if (sumOfParts > 100.1) { // Add a small tolerance for floating point math
      showMessage(`Nutrients add up to ${sumOfParts.toFixed(1)}% (more than 100%). Please check values.`, 'error');
      return;
    }

    const { kcal, carbs, error } = calculateKcal(protein, fat, fibre, ash, moisture);

    if (error) {
      showMessage(error, 'error');
      return;
    }

    onAddFood({
      id: `food_${new Date().getTime()}`,
      name,
      kcalPer100g: kcal,
      // Pass full details
      protein: proteinNum,
      fat: fatNum,
      fibre: fibreNum,
      ash: ashNum,
      moisture: moistureNum,
    });

    // Clear form
    setName('');
    setProtein('');
    setFat('');
    setFibre('');
    setAsh('');
    setMoisture('');
    setPasteData('');
    showMessage(`Added "${name}" (${kcal.toFixed(0)} Kcal/100g)`, 'success');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Food Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Chicken Dry Food"
      />

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">Paste Analytical Constituents</label>
        <textarea
          value={pasteData}
          onChange={handlePasteChange}
          placeholder="Paste label text here...
e.g., 'Protein 42%', 'Fat 15%'"
          className="w-full min-h-24 max-h-40 p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm bg-white text-gray-900 resize-y overflow-y-auto"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Protein %"
          type="number"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
          placeholder="e.g., 42"
          min="0"
          step="0.1"
        />
        <Input
          label="Fat %"
          type="number"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
          placeholder="e.g., 15"
          min="0"
          step="0.1"
        />
        <Input
          label="Fibre %"
          type="number"
          value={fibre}
          onChange={(e) => setFibre(e.target.value)}
          placeholder="e.g., 6"
          min="0"
          step="0.1"
        />
        <Input
          label="Ash %"
          type="number"
          value={ash}
          onChange={(e) => setAsh(e.target.value)}
          placeholder="e.g., 10"
          min="0"
          step="0.1"
        />
        <Input
          label="Moisture %"
          type="number"
          value={moisture}
          onChange={(e) => setMoisture(e.target.value)}
          placeholder="e.g., 10 (or 8 if dry)"
          min="0"
          step="0.1"
        />
      </div>
      <Button type="submit" variant="primary">Add Food</Button>
    </form>
  );
};

// Component to manage the cat's profile
const CatProfile = ({ weight, activityLevel, onWeightChange, onAttributeChange }) => {
  const { rer, mer } = useMemo(() => calculateMER(weight, activityLevel), [weight, activityLevel]);

  return (
    <div className="space-y-4">
      <Input
        label="Cat's Weight (kg)"
        type="number"
        value={weight}
        onChange={(e) => onWeightChange(e.target.value)}
        placeholder="e.g., 4.5"
        min="0.1"
        step="0.1"
      />

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">Cat's Life Stage</label>
        <select
          value={activityLevel}
          onChange={(e) => onAttributeChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 shadow-sm bg-white text-gray-900"
        >
          <option value="neutered">Neutered Adult</option>
          <option value="intact">Intact Adult</option>
          <option value="inactive">Inactive / Obese Prone</option>
          <option value="weight_loss">Weight Loss Plan</option>
          <option value="weight_gain">Weight Gain Plan</option>
          <option value="kitten_old">Kitten (4-12 months)</option>
          <option value="kitten_young">Kitten (0-4 months)</option>
        </select>
      </div>

      <div className="text-center p-4 bg-blue-50 rounded-lg space-y-2">
        <div className="flex justify-around items-center">
          <div>
            <span className="text-sm text-blue-700">Daily RER</span>
            <h4 className="text-2xl font-bold text-blue-900">
              {rer.toFixed(0)} <span className="text-lg">Kcal</span>
            </h4>
          </div>
          <div>
            <span className="text-sm text-blue-700">Daily MER</span>
            <h4 className="text-3xl font-bold text-blue-900">
              {mer.toFixed(0)} <span className="text-xl">Kcal</span>
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};

// Form to add a new meal
const MealForm = ({ foods, onAddMeal, showMessage }) => {
  const [mealName, setMealName] = useState('');
  const [caloriePercent, setCaloriePercent] = useState('50');

  // This state holds the percentage for each food, always summing to 100
  const [ratios, setRatios] = useState({});

  // Effect to initialize or reset ratios when the food list changes
  useEffect(() => {
    if (foods.length > 0) {
      const foodIds = foods.map(f => f.id);
      const newRatios = { ...ratios };
      let ratiosChanged = false;

      // Add new foods with 0%
      foodIds.forEach(id => {
        if (newRatios[id] === undefined) {
          newRatios[id] = 0;
          ratiosChanged = true;
        }
      });

      // Remove old foods
      Object.keys(newRatios).forEach(id => {
        if (!foodIds.includes(id)) {
          delete newRatios[id];
          ratiosChanged = true;
        }
      });

      // If this is the very first food, set it to 100%
      if (foods.length === 1 && Object.values(newRatios)[0] === 0) {
        newRatios[foods[0].id] = 100;
        ratiosChanged = true;
      }

      // If foods were removed and total is now 0, set first food to 100
      const currentTotal = Object.values(newRatios).reduce((s, v) => s + v, 0);
      if (foods.length > 0 && currentTotal < 0.1 && ratiosChanged) {
        newRatios[foods[0].id] = 100;
        ratiosChanged = true;
      }

      if (ratiosChanged) {
        setRatios(newRatios);
      }

    } else {
      setRatios({});
    }
  }, [foods]); // Dependency on the food list


  // Handle simple slider/input changes
  const handleRatioChange = (changedFoodId, newValue) => {
    const newValueNum = parseFloat(newValue) || 0; // Default to 0 if NaN or empty string

    setRatios(prev => ({
      ...prev,
      // Clamp value between 0 and 100
      [changedFoodId]: Math.max(0, Math.min(100, newValueNum))
    }));
  };

  const totalRatioSum = useMemo(() => {
    return Object.values(ratios).reduce((s, v) => s + v, 0);
  }, [ratios]);

  const isTotalValid = useMemo(() => Math.abs(totalRatioSum - 100) < 0.1, [totalRatioSum]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const percent = parseFloat(caloriePercent);

    // Stricter check for 100%
    if (!isTotalValid) {
      showMessage('Total food split must be exactly 100%.', 'error');
      return;
    }

    if (isNaN(percent) || percent <= 0 || !mealName) {
      showMessage('Please complete meal name and calorie %.', 'error');
      return;
    }

    const split = Object.entries(ratios).map(([foodId, ratio]) => ({
      foodId: foodId,
      ratio: ratio / 100, // Ratio is already a percentage, so divide by 100
    }));

    onAddMeal({
      id: `meal_${new Date().getTime()}`,
      name: mealName,
      caloriePercent: percent,
      split,
    });

    setMealName('');
    setCaloriePercent('50');
    // Reset ratios: set first food to 100, others to 0
    if (foods.length > 0) {
      const newRatios = {};
      foods.forEach((food, index) => {
        newRatios[food.id] = (index === 0) ? 100 : 0;
      });
      setRatios(newRatios);
    }

    showMessage(`Added "${mealName}" meal`, 'success');
  };

  if (foods.length === 0) {
    return <p className="text-gray-500">Add at least one food to create a meal plan.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Meal Name"
        type="text"
        value={mealName}
        onChange={(e) => setMealName(e.target.value)}
        placeholder="e.g., Breakfast"
      />
      <Input
        label="Share of Daily Calories"
        type="number"
        value={caloriePercent}
        onChange={(e) => setCaloriePercent(e.target.value)}
        placeholder="e.g., 50"
        min="1"
        max="100"
        step="1"
        adornment="%"
        inputClassName="pr-10"
      />

      <div className="space-y-4 pt-2">
        <h4 className="text-sm font-medium text-gray-700">Food Split for this Meal</h4>
        {foods.map(food => (
          <div key={food.id} className="space-y-2">
            <div className="flex justify-between items-center space-x-2">
              <span className="text-gray-700 flex-1">{food.name}</span>
              {/* New number input for the ratio */}
              <div className="flex items-center space-x-1 w-28">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(ratios[food.id] || 0)}
                  onChange={(e) => handleRatioChange(food.id, e.target.value)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-right focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
                <span className="text-gray-500">%</span>
              </div>
            </div>
            <Slider
              label=""
              min={0}
              max={100}
              value={ratios[food.id] || 0}
              onChange={(e) => handleRatioChange(food.id, e.target.value)}
              style={{
                background: `linear-gradient(to right, #2563EB 0%, #2563EB ${ratios[food.id] || 0}%, #d1d5db ${ratios[food.id] || 0}%, #d1d5db 100%)`
              }}
            />
          </div>
        ))}
      </div>

      {/* Total display */}
      <div className="mt-4 p-3 bg-gray-100 rounded-lg text-center">
        <span className="font-semibold text-gray-700">Total Split</span>
        <h4 className={`text-2xl font-bold ${isTotalValid ? 'text-green-600' : 'text-red-600'}`}>
          {totalRatioSum.toFixed(0)}%
        </h4>
        {!isTotalValid && (
          <p className="text-red-600 text-sm mt-1">Total must be 100%</p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={!isTotalValid}
      >
        Add Meal
      </Button>
    </form>
  );
};

// --- Main App Component ---

function App() {
  const [foods, setFoods] = useState([]); // Removed debug food
  const [meals, setMeals] = useState([]);
  const [catWeight, setCatWeight] = useState('4.5');
  const [catActivity, setCatActivity] = useState('neutered'); // NEW: Replaced attributes object
  const [message, setMessage] = useState(null);

  const showMessage = (msg, type = 'info', duration = 3000) => {
    setMessage({ msg, type });
    setTimeout(() => {
      setMessage(null);
    }, duration);
  };

  const handleAddFood = (food) => {
    setFoods(prev => [...prev, food]);
  };

  const handleCopyDetails = (food) => {
    // Check if all required properties exist.
    if (food.protein === undefined || food.fat === undefined || food.fibre === undefined || food.ash === undefined || food.moisture === undefined) {
      showMessage('Cannot copy details - full nutrient data not available.', 'error');
      return;
    }

    // Format as a string object with generated ID
    const detailsString = `{ id: '${food.name.toLowerCase().replace(/ /g, '_')}', name: '${food.name}', protein: ${food.protein}, fat: ${food.fat}, fibre: ${food.fibre}, ash: ${food.ash}, moisture: ${food.moisture} },`;

    // Use a temporary textarea to copy to clipboard (works in iFrames)
    const textArea = document.createElement('textarea');
    textArea.value = detailsString;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showMessage(`Copied details for "${food.name}"`, 'success');
    } catch (err) {
      showMessage('Failed to copy details.', 'error');
    }
    document.body.removeChild(textArea);
  };

  const deleteFood = (foodId) => {
    setFoods(prev => prev.filter(f => f.id !== foodId));
    // Also remove this food from any meal splits
    setMeals(prevMeals => prevMeals.map(meal => {
      const newSplit = meal.split.filter(s => s.foodId !== foodId);
      // Rescale ratios
      const totalRatio = newSplit.reduce((acc, s) => acc + s.ratio, 0);
      if (totalRatio > 0) {
        return {
          ...meal,
          split: newSplit.map(s => ({ ...s, ratio: s.ratio / totalRatio }))
        };
      }
      return { ...meal, split: [] }; // or remove meal?
    }).filter(meal => meal.split.length > 0)); // Remove meals that are now empty
  };

  const handleAddMeal = (meal) => {
    setMeals(prev => [...prev, meal]);
  };

  const deleteMeal = (mealId) => {
    setMeals(prev => prev.filter(m => m.id !== mealId));
  };

  const { rer, mer: totalMER } = useMemo(() => calculateMER(catWeight, catActivity), [catWeight, catActivity]);

  const totalMealPercent = useMemo(() => {
    return meals.reduce((acc, meal) => acc + meal.caloriePercent, 0);
  }, [meals]);

  const feedingSchedule = useMemo(() => {
    const foodMap = new Map(foods.map(f => [f.id, f]));
    return meals.map(meal => {
      const mealCalories = totalMER * (meal.caloriePercent / 100);
      const foodAmounts = meal.split.map(split => {
        const food = foodMap.get(split.foodId);
        if (!food) return { name: 'Unknown Food', grams: 0 };

        // Kcal needed from this food = total meal kcal * this food's ratio
        const kcalNeededFromFood = mealCalories * split.ratio;
        // Grams = (Kcal needed / Kcal per 100g) * 100
        const grams = (kcalNeededFromFood / food.kcalPer100g) * 100;

        return {
          name: food.name,
          grams: grams,
        };
      }).filter(item => item.grams > 0.01); // Don't show 0g items

      return {
        ...meal,
        foodAmounts,
      };
    });
  }, [meals, totalMER, foods]);

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-8 font-sans">
        <Message
          message={message?.msg}
          type={message?.type}
          onClose={() => setMessage(null)}
        />
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
            🐱 Cat Food Calculator
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Calculate your cat's daily calorie needs and plan their meals with precision.
          </p>
        </header>

        <div className="space-y-8 max-w-2xl mx-auto">
          <Card title="1. Add Your Cat Foods">
            {/* NEW: Library selector section */}
            <h4 className="text-lg font-semibold text-gray-700 mb-3">Add from Library</h4>
            <FoodLibrarySelector
              onAddFood={handleAddFood}
              showMessage={showMessage}
              currentFoods={foods}
            />

            {/* Divider and manual entry section */}
            <div className="border-t my-6"></div>
            <h4 className="text-lg font-semibold text-gray-700 mb-3">Or Add Manually</h4>
            <FoodForm onAddFood={handleAddFood} showMessage={showMessage} />

            <div className="mt-6 space-y-2">
              {foods.length === 0 && (
                <p className="text-gray-500 text-center p-2">Your added foods will appear here.</p>
              )}
              {foods.map(food => (
                <div key={food.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-800">{food.name}</span>
                  <div className="text-right flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-600">{food.kcalPer100g.toFixed(0)} Kcal/100g</span>
                    <button
                      onClick={() => handleCopyDetails(food)}
                      className="text-blue-500 hover:text-blue-700 text-sm font-semibold"
                      title="Copy details as code"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => deleteFood(food.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="2. Cat's Profile">
            <CatProfile
              weight={catWeight}
              activityLevel={catActivity}
              onWeightChange={setCatWeight}
              onAttributeChange={setCatActivity}
            />
          </Card>

          <Card title="3. Create Meal Plan">
            <MealForm
              foods={foods}
              onAddMeal={handleAddMeal}
              showMessage={showMessage}
            />
            {meals.length > 0 && (
              <div className="mt-6 space-y-2">
                {meals.map(meal => (
                  <div key={meal.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-800">{meal.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({meal.caloriePercent}%)</span>
                    </div>
                    <button
                      onClick={() => deleteMeal(meal.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            {totalMealPercent > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
                <span className="font-semibold text-blue-800">
                  {totalMealPercent.toFixed(0)}% of {totalMER.toFixed(0)} Kcal
                </span>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div
                    className={`h-2.5 rounded-full ${totalMealPercent > 100.1 ? 'bg-red-500' : 'bg-blue-600'}`}
                    style={{ width: `${Math.min(totalMealPercent, 100)}%` }}
                  ></div>
                </div>
                {totalMealPercent > 100.1 && (
                  <p className="text-red-600 text-sm mt-1">Warning: Meal calories exceed 100%.</p>
                )}
              </div>
            )}
          </Card>

          <Card title="4. Final Feeding Schedule">
            {feedingSchedule.length === 0 ? (
              <p className="text-gray-500">Add your cat's profile and create at least one meal to see the schedule.</p>
            ) : (
              <div className="space-y-6">
                {feedingSchedule.map(meal => (
                  <div key={meal.id} className="p-4 border border-gray-200 rounded-lg bg-green-50">
                    <h4 className="text-lg font-bold text-green-900">{meal.name}</h4>
                    <p className="text-sm text-green-700 mb-3">
                      ({(totalMER * (meal.caloriePercent / 100)).toFixed(0)} Kcal)
                    </p>
                    <ul className="space-y-2">
                      {meal.foodAmounts.map((amount, index) => (
                        <li key={index} className="flex justify-between items-baseline">
                          <span className="text-gray-700">{amount.name}</span>
                          <span className="text-xl font-bold text-green-900">
                            {amount.grams.toFixed(1)}g
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                <div className="text-center p-4 bg-gray-100 rounded-lg">
                  <span className="text-sm text-gray-700">Total Daily Amount</span>
                  <h4 className="text-2xl font-bold text-gray-900">
                    {totalMER.toFixed(0)} <span className="text-lg">Kcal / day</span>
                  </h4>
                </div>

              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;
