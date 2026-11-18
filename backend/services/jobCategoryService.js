const CATEGORY_TITLE_RULES = {
  healthcare: {
    allow:
      /\b(doctor|physician|nurse|nursing|clinical nurse|medical officer|medical data|pharmacist|pharmacy|surgeon|radiologist|radiology|dentist|therapist|caregiver|patient care|healthcare assistant|hospital staff)\b/i,
    exclude:
      /\b(account executive|sales|marketing|business development|software|developer|engineer)\b/i,
  },
  customer_service: {
    allow:
      /\b(customer service|customer support|customer success|client support|technical support|helpdesk|help desk|call center|support specialist|support associate|support representative|service representative)\b/i,
    exclude:
      /\b(marketing|sales executive|solutions architect|software engineer|it analyst)\b/i,
  },
  retail_sales: {
    allow:
      /\b(store associate|store manager|cashier|retail sales associate|merchandiser|shop assistant|showroom assistant|fashion associate|store cashier|retail cashier)\b/i,
    exclude:
      /\b(account executive|enterprise sales|business development|inside sales|financial sales|financial data|sales engineer|pre-sales|solutions architect|growth marketing)\b/i,
  },
  education: {
    allow:
      /\b(teacher|teaching|tutor|instructor|educator|professor|lecturer|school counselor|academic advisor|academic associate|assistant professor|education coordinator)\b/i,
    exclude:
      /\b(nurse|nursing|radiology|radiographer|clinical|medical|physician|doctor|operation theatre|fitness instructor|software trainer|sales trainer|fitness trainer|licensed.*ai trainer|freelance ai trainer)\b/i,
  },
  hospitality: {
    allow:
      /\b(chef de cuisine|executive chef|sous chef|head chef|line cook|cook\b|barista|hotel manager|hotel operations|restaurant manager|restaurant supervisor|front desk agent|front office agent|front desk associate|housekeeping|guest service|guest relations?|concierge|banquet|culinary|waiter|waitress|room attendant|food and beverage|catering|kitchen manager|spa therapist|massage therapist|loss prevention manager|wellness consultant)\b/i,
    exclude:
      /\b(marketing|sales executive|software engineer|solutions architect|systems manager|human resource|financial controller|project manager|data analyst)\b/i,
  },
  transportation: {
    allow:
      /\b(truck driver|delivery driver|bus driver|chauffeur|courier|fleet driver|dispatcher|logistics coordinator|logistics assistant|warehouse operator|forklift operator|transport operator|route planner)\b/i,
    exclude:
      /\b(solution architect|procurement|director of indirect|logistics manager software|sap s\/4hana|systems architect)\b/i,
  },
  technology: {
    allow:
      /\b(software engineer|software developer|full stack|frontend|backend|web developer|data engineer|data scientist|machine learning|ai engineer|devops|cloud engineer|cybersecurity|network engineer|systems engineer|qa engineer|sdet|product designer|ux designer|ui designer|solution architect|programmer|it support)\b/i,
    exclude:
      /\b(hotel|restaurant|spa|massage|nurse|doctor|marketing manager|sales manager|account executive)\b/i,
  },
};

function getCategoryTitleRule(category) {
  return CATEGORY_TITLE_RULES[category] || null;
}

function isTitleAllowedForCategory(category, title) {
  const rule = getCategoryTitleRule(category);
  if (!rule) return true;
  const text = String(title || "");
  return rule.allow.test(text) && !rule.exclude.test(text);
}

module.exports = {
  CATEGORY_TITLE_RULES,
  getCategoryTitleRule,
  isTitleAllowedForCategory,
};
