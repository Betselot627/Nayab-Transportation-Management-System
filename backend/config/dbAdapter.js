const prisma = require("./prisma");
const bcrypt = require("bcryptjs");

// Mapping MongoDB dotted paths to flat relational Prisma fields
const KEY_MAPS = {
  // Customer address
  "address.street": "addressStreet",
  "address.city": "addressCity",
  "address.state": "addressState",
  "address.zipCode": "addressZipCode",
  "address.country": "addressCountry",
  // Customer contactPerson
  "contactPerson.name": "contactPersonName",
  "contactPerson.phone": "contactPersonPhone",
  "contactPerson.email": "contactPersonEmail",
  
  // Vehicle capacity
  "capacity.weight": "capacityWeight",
  "capacity.unit": "capacityUnit",
  // Vehicle insurance
  "insurance.company": "insuranceCompany",
  "insurance.policyNumber": "insurancePolicyNumber",
  "insurance.expiryDate": "insuranceExpiryDate",
  "insurance.document": "insuranceDocument",
  // Vehicle registration
  "registration.number": "registrationNumber",
  "registration.expiryDate": "registrationExpiryDate",
  "registration.document": "registrationDocument",

  // Shipment pickupLocation
  "pickupLocation.address": "pickupAddress",
  "pickupLocation.city": "pickupCity",
  "pickupLocation.coordinates": "pickupCoordinates",
  "pickupLocation.contactPerson.name": "pickupContactName",
  "pickupLocation.contactPerson.phone": "pickupContactPhone",
  // Shipment destination
  "destination.address": "destinationAddress",
  "destination.city": "destinationCity",
  "destination.coordinates": "destinationCoordinates",
  "destination.contactPerson.name": "destinationContactName",
  "destination.contactPerson.phone": "destinationContactPhone",
  // Shipment cargoDetails
  "cargoDetails.type": "cargoType",
  "cargoDetails.weight": "cargoWeight",
  "cargoDetails.unit": "cargoUnit",
  "cargoDetails.description": "cargoDescription",
  "cargoDetails.quantity": "cargoQuantity",
  "cargoDetails.specialInstructions": "cargoSpecialInstructions",
  // Shipment pricing
  "pricing.baseAmount": "baseAmount",
  "pricing.additionalCharges": "additionalCharges",
  "pricing.totalAmount": "totalAmount",
  "pricing.currency": "currency",
  // Shipment documents
  "documents.invoices": "invoices",
  "documents.receipts": "receipts",
  "documents.proofOfDelivery": "proofOfDelivery",
  "documents.other": "otherDocuments",

  // Maintenance provider
  "serviceProvider.name": "serviceProviderName",
  "serviceProvider.contact": "serviceProviderContact",
  "serviceProvider.address": "serviceProviderAddress",
  // Maintenance cost
  "cost.labor": "costLabor",
  "cost.parts": "costParts",
  "cost.other": "costOther",
  "cost.total": "costTotal",

  // Mongoose relation keys to Prisma scalar keys
  "registeredBy": "registeredById",
  "approvedBy": "approvedById",
  "currentDriver": "currentDriverId",
  "assignedCustomer": "assignedCustomerId",
  "priceConfirmedBy": "priceConfirmedById",
  "createdBy": "createdById",
  "paidBy": "paidById",
  "processedBy": "processedById",
};

function mapMongoKeyToPrisma(key) {
  if (KEY_MAPS[key]) return KEY_MAPS[key];
  return key;
}

// Convert Mongoose populate paths to Prisma includes
const POPULATE_MAPS = {
  User: {},
  Customer: {
    userId: { relation: "user", scalar: "userId", model: "User" }
  },
  Driver: {
    userId: { relation: "user", scalar: "userId", model: "User" }
  },
  Vehicle: {
    registeredBy: { relation: "registeredBy", scalar: "registeredById", model: "Driver" },
    approvedBy: { relation: "approvedBy", scalar: "approvedById", model: "User" },
    currentDriver: { relation: "currentDriver", scalar: "currentDriverId", model: "Driver" },
    assignedCustomer: { relation: "assignedCustomer", scalar: "assignedCustomerId", model: "Customer" }
  },
  Shipment: {
    customerId: { relation: "customer", scalar: "customerId", model: "Customer" },
    vehicleId: { relation: "vehicle", scalar: "vehicleId", model: "Vehicle" },
    driverId: { relation: "driver", scalar: "driverId", model: "Driver" },
    priceConfirmedBy: { relation: "priceConfirmedBy", scalar: "priceConfirmedById", model: "User" }
  },
  Trip: {
    shipmentId: { relation: "shipment", scalar: "shipmentId", model: "Shipment" },
    driverId: { relation: "driver", scalar: "driverId", model: "Driver" },
    vehicleId: { relation: "vehicle", scalar: "vehicleId", model: "Vehicle" }
  },
  Maintenance: {
    vehicleId: { relation: "vehicle", scalar: "vehicleId", model: "Vehicle" },
    createdBy: { relation: "createdBy", scalar: "createdById", model: "User" }
  },
  Payment: {
    shipmentId: { relation: "shipment", scalar: "shipmentId", model: "Shipment" },
    customerId: { relation: "customer", scalar: "customerId", model: "Customer" },
    paidBy: { relation: "paidBy", scalar: "paidById", model: "User" },
    processedBy: { relation: "processedBy", scalar: "processedById", model: "User" }
  },
  Notification: {
    userId: { relation: "user", scalar: "userId", model: "User" }
  }
};

// Document wrapper that exposes Mongoose-like properties and methods
class Document {
  constructor(data, modelName) {
    Object.assign(this, data);
    this._modelName = modelName;
  }

  get id() {
    return this._id;
  }

  set id(val) {
    this._id = val;
  }

  // Support for password hashing and validation
  async matchPassword(enteredPassword) {
    if (this._modelName !== "User") throw new Error("matchPassword is only available on User model");
    return await bcrypt.compare(enteredPassword, this.password);
  }

  async save() {
    const model = makeModel(this._modelName);
    
    // Execute pre-save lifecycle hooks
    await runPreSaveHooks(this, this._modelName);
    
    const dbData = toDbObj(this, this._modelName);
    const id = dbData.id;
    
    let savedObj;
    if (id) {
      delete dbData.id;
      savedObj = await model.prismaDelegate.update({
        where: { id },
        data: dbData,
      });
    } else {
      savedObj = await model.prismaDelegate.create({
        data: dbData,
      });
    }
    
    const mapped = toMongooseDoc(savedObj, this._modelName);
    Object.keys(this).forEach(k => delete this[k]);
    Object.assign(this, mapped);
    return this;
  }

  async deleteOne() {
    const model = makeModel(this._modelName);
    if (this._id) {
      await model.prismaDelegate.delete({
        where: { id: this._id }
      });
    }
  }

  async remove() {
    return this.deleteOne();
  }

  toObject() {
    const obj = { ...this };
    delete obj._modelName;
    return obj;
  }

  toJSON() {
    return this.toObject();
  }
}

// Convert a flat DB object from PostgreSQL to Mongoose's nested structure
function toMongooseDoc(dbObj, modelName) {
  if (!dbObj) return null;
  const doc = { ...dbObj };
  doc._id = dbObj.id;
  
  if (modelName === "Customer") {
    doc.address = {
      street: dbObj.addressStreet,
      city: dbObj.addressCity,
      state: dbObj.addressState,
      zipCode: dbObj.addressZipCode,
      country: dbObj.addressCountry,
    };
    doc.contactPerson = {
      name: dbObj.contactPersonName,
      phone: dbObj.contactPersonPhone,
      email: dbObj.contactPersonEmail,
    };
    delete doc.addressStreet;
    delete doc.addressCity;
    delete doc.addressState;
    delete doc.addressZipCode;
    delete doc.addressCountry;
    delete doc.contactPersonName;
    delete doc.contactPersonPhone;
    delete doc.contactPersonEmail;
  }
  
  if (modelName === "Vehicle") {
    doc.capacity = {
      weight: dbObj.capacityWeight,
      unit: dbObj.capacityUnit,
    };
    doc.insurance = {
      company: dbObj.insuranceCompany,
      policyNumber: dbObj.insurancePolicyNumber,
      expiryDate: dbObj.insuranceExpiryDate,
      document: dbObj.insuranceDocument,
    };
    doc.registration = {
      number: dbObj.registrationNumber,
      expiryDate: dbObj.registrationExpiryDate,
      document: dbObj.registrationDocument,
    };
    delete doc.capacityWeight;
    delete doc.capacityUnit;
    delete doc.insuranceCompany;
    delete doc.insurancePolicyNumber;
    delete doc.insuranceExpiryDate;
    delete doc.insuranceDocument;
    delete doc.registrationNumber;
    delete doc.registrationExpiryDate;
    delete doc.registrationDocument;
  }

  if (modelName === "Shipment") {
    doc.pickupLocation = {
      address: dbObj.pickupAddress,
      city: dbObj.pickupCity,
      coordinates: dbObj.pickupCoordinates || [0, 0],
      contactPerson: {
        name: dbObj.pickupContactName,
        phone: dbObj.pickupContactPhone,
      }
    };
    doc.destination = {
      address: dbObj.destinationAddress,
      city: dbObj.destinationCity,
      coordinates: dbObj.destinationCoordinates || [0, 0],
      contactPerson: {
        name: dbObj.destinationContactName,
        phone: dbObj.destinationContactPhone,
      }
    };
    doc.cargoDetails = {
      type: dbObj.cargoType,
      weight: dbObj.cargoWeight,
      unit: dbObj.cargoUnit,
      description: dbObj.cargoDescription,
      quantity: dbObj.cargoQuantity,
      specialInstructions: dbObj.cargoSpecialInstructions,
    };
    doc.pricing = {
      baseAmount: dbObj.baseAmount,
      additionalCharges: dbObj.additionalCharges,
      totalAmount: dbObj.totalAmount,
      currency: dbObj.currency,
    };
    doc.documents = {
      invoices: dbObj.invoices || [],
      receipts: dbObj.receipts || [],
      proofOfDelivery: dbObj.proofOfDelivery,
      other: dbObj.otherDocuments || [],
    };
    
    delete doc.pickupAddress;
    delete doc.pickupCity;
    delete doc.pickupCoordinates;
    delete doc.pickupContactName;
    delete doc.pickupContactPhone;
    delete doc.destinationAddress;
    delete doc.destinationCity;
    delete doc.destinationCoordinates;
    delete doc.destinationContactName;
    delete doc.destinationContactPhone;
    delete doc.cargoType;
    delete doc.cargoWeight;
    delete doc.cargoUnit;
    delete doc.cargoDescription;
    delete doc.cargoQuantity;
    delete doc.cargoSpecialInstructions;
    delete doc.baseAmount;
    delete doc.additionalCharges;
    delete doc.totalAmount;
    delete doc.currency;
    delete doc.proofOfDelivery;
    delete doc.otherDocuments;
  }

  if (modelName === "Maintenance") {
    doc.serviceProvider = {
      name: dbObj.serviceProviderName,
      contact: dbObj.serviceProviderContact,
      address: dbObj.serviceProviderAddress,
    };
    doc.cost = {
      labor: dbObj.costLabor,
      parts: dbObj.costParts,
      other: dbObj.costOther,
      total: dbObj.costTotal,
    };
    delete doc.serviceProviderName;
    delete doc.serviceProviderContact;
    delete doc.serviceProviderAddress;
    delete doc.costLabor;
    delete doc.costParts;
    delete doc.costOther;
    delete doc.costTotal;
  }

  if (modelName === "Notification") {
    if (dbObj.relatedEntityType || dbObj.relatedEntityId) {
      doc.relatedEntity = {
        entityType: dbObj.relatedEntityType,
        entityId: dbObj.relatedEntityId,
      };
    } else {
      doc.relatedEntity = null;
    }
    delete doc.relatedEntityType;
    delete doc.relatedEntityId;
  }

  // Map scalar database keys back to Mongoose names (e.g., registeredById -> registeredBy)
  const pMap = POPULATE_MAPS[modelName] || {};
  for (const [key, pSpec] of Object.entries(pMap)) {
    const scalarKey = pSpec.scalar || key;
    if (dbObj[scalarKey] !== undefined) {
      doc[key] = dbObj[scalarKey];
      if (scalarKey !== key) {
        delete doc[scalarKey];
      }
    }
  }

  // Handle populated relation objects mapped dynamically
  for (const [key, pSpec] of Object.entries(pMap)) {
    if (dbObj[pSpec.relation]) {
      doc[key] = toMongooseDoc(dbObj[pSpec.relation], pSpec.model);
      delete doc[pSpec.relation];
    } else if (dbObj[key] && typeof dbObj[key] === "object" && dbObj[key].id) {
      // If it was already mapped/populated, re-wrap it
      doc[key] = toMongooseDoc(dbObj[key], pSpec.model);
    }
  }
  
  return new Document(doc, modelName);
}

// Convert Mongoose doc structure back to flat PostgreSQL DB columns
function toDbObj(mongooseData, modelName) {
  const dbObj = { ...mongooseData };
  if (dbObj._id) {
    dbObj.id = String(dbObj._id);
    delete dbObj._id;
  }
  
  if (modelName === "Customer") {
    if (mongooseData.address) {
      dbObj.addressStreet = mongooseData.address.street;
      dbObj.addressCity = mongooseData.address.city;
      dbObj.addressState = mongooseData.address.state;
      dbObj.addressZipCode = mongooseData.address.zipCode;
      dbObj.addressCountry = mongooseData.address.country;
      delete dbObj.address;
    }
    if (mongooseData.contactPerson) {
      dbObj.contactPersonName = mongooseData.contactPerson.name;
      dbObj.contactPersonPhone = mongooseData.contactPerson.phone;
      dbObj.contactPersonEmail = mongooseData.contactPerson.email;
      delete dbObj.contactPerson;
    }
  }

  if (modelName === "Vehicle") {
    if (mongooseData.capacity) {
      dbObj.capacityWeight = Number(mongooseData.capacity.weight);
      dbObj.capacityUnit = mongooseData.capacity.unit;
      delete dbObj.capacity;
    }
    if (mongooseData.insurance) {
      dbObj.insuranceCompany = mongooseData.insurance.company;
      dbObj.insurancePolicyNumber = mongooseData.insurance.policyNumber;
      dbObj.insuranceExpiryDate = mongooseData.insurance.expiryDate ? new Date(mongooseData.insurance.expiryDate) : undefined;
      dbObj.insuranceDocument = mongooseData.insurance.document;
      delete dbObj.insurance;
    }
    if (mongooseData.registration) {
      dbObj.registrationNumber = mongooseData.registration.number;
      dbObj.registrationExpiryDate = mongooseData.registration.expiryDate ? new Date(mongooseData.registration.expiryDate) : undefined;
      dbObj.registrationDocument = mongooseData.registration.document;
      delete dbObj.registration;
    }
  }

  if (modelName === "Shipment") {
    if (mongooseData.pickupLocation) {
      dbObj.pickupAddress = mongooseData.pickupLocation.address;
      dbObj.pickupCity = mongooseData.pickupLocation.city;
      dbObj.pickupCoordinates = mongooseData.pickupLocation.coordinates;
      if (mongooseData.pickupLocation.contactPerson) {
        dbObj.pickupContactName = mongooseData.pickupLocation.contactPerson.name;
        dbObj.pickupContactPhone = mongooseData.pickupLocation.contactPerson.phone;
      }
      delete dbObj.pickupLocation;
    }
    if (mongooseData.destination) {
      dbObj.destinationAddress = mongooseData.destination.address;
      dbObj.destinationCity = mongooseData.destination.city;
      dbObj.destinationCoordinates = mongooseData.destination.coordinates;
      if (mongooseData.destination.contactPerson) {
        dbObj.destinationContactName = mongooseData.destination.contactPerson.name;
        dbObj.destinationContactPhone = mongooseData.destination.contactPerson.phone;
      }
      delete dbObj.destination;
    }
    if (mongooseData.cargoDetails) {
      dbObj.cargoType = mongooseData.cargoDetails.type;
      dbObj.cargoWeight = Number(mongooseData.cargoDetails.weight);
      dbObj.cargoUnit = mongooseData.cargoDetails.unit;
      dbObj.cargoDescription = mongooseData.cargoDetails.description;
      dbObj.cargoQuantity = Number(mongooseData.cargoDetails.quantity) || 1;
      dbObj.cargoSpecialInstructions = mongooseData.cargoDetails.specialInstructions;
      delete dbObj.cargoDetails;
    }
    if (mongooseData.pricing) {
      dbObj.baseAmount = Number(mongooseData.pricing.baseAmount) || 0;
      dbObj.additionalCharges = Number(mongooseData.pricing.additionalCharges) || 0;
      dbObj.totalAmount = Number(mongooseData.pricing.totalAmount) || 0;
      dbObj.currency = mongooseData.pricing.currency || "ETB";
      delete dbObj.pricing;
    }
    if (mongooseData.documents) {
      dbObj.invoices = mongooseData.documents.invoices;
      dbObj.receipts = mongooseData.documents.receipts;
      dbObj.proofOfDelivery = mongooseData.documents.proofOfDelivery;
      dbObj.otherDocuments = mongooseData.documents.other;
      delete dbObj.documents;
    }
  }

  if (modelName === "Maintenance") {
    if (mongooseData.serviceProvider) {
      dbObj.serviceProviderName = mongooseData.serviceProvider.name;
      dbObj.serviceProviderContact = mongooseData.serviceProvider.contact;
      dbObj.serviceProviderAddress = mongooseData.serviceProvider.address;
      delete dbObj.serviceProvider;
    }
    if (mongooseData.cost) {
      dbObj.costLabor = Number(mongooseData.cost.labor) || 0;
      dbObj.costParts = Number(mongooseData.cost.parts) || 0;
      dbObj.costOther = Number(mongooseData.cost.other) || 0;
      dbObj.costTotal = Number(mongooseData.cost.total) || 0;
      delete dbObj.cost;
    }
  }

  if (modelName === "Notification") {
    if (mongooseData.relatedEntity) {
      dbObj.relatedEntityType = mongooseData.relatedEntity.entityType;
      dbObj.relatedEntityId = String(mongooseData.relatedEntity.entityId);
      delete dbObj.relatedEntity;
    }
  }

  // Clean relation objects and model parameters
  delete dbObj._modelName;
  const pMap = POPULATE_MAPS[modelName] || {};
  for (const [key, pSpec] of Object.entries(pMap)) {
    delete dbObj[pSpec.relation];
    delete dbObj[key]; // also delete relation foreign key if it is populated
    delete dbObj[pSpec.scalar || key]; // delete scalar if it is there to avoid duplicate assignment
    
    // Put back actual foreign key property
    if (mongooseData[key]) {
      const isObjectVal = typeof mongooseData[key] === "object" && mongooseData[key] !== null;
      dbObj[pSpec.scalar || key] = isObjectVal ? String(mongooseData[key]._id || mongooseData[key].id) : String(mongooseData[key]);
    }
  }
  
  return dbObj;
}

// Pre-save model lifecycle hooks helper
async function runPreSaveHooks(doc, modelName) {
  if (modelName === "User") {
    if (doc.password && !doc.password.startsWith("$2a$") && !doc.password.startsWith("$2b$")) {
      const salt = await bcrypt.genSalt(10);
      doc.password = await bcrypt.hash(doc.password, salt);
    }
  }
  
  if (modelName === "Maintenance") {
    if (!doc.maintenanceNumber) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const count = await prisma.maintenance.count();
      doc.maintenanceNumber = `MNT-${year}${month}-${String(count + 1).padStart(5, "0")}`;
    }
    const labor = doc.cost?.labor || 0;
    const parts = doc.cost?.parts || 0;
    const other = doc.cost?.other || 0;
    doc.cost = doc.cost || {};
    doc.cost.total = labor + parts + other;
  }
  
  if (modelName === "Payment") {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    if (!doc.paymentNumber) {
      const timestamp = Date.now().toString().slice(-6);
      doc.paymentNumber = `PAY-${year}${month}-${timestamp}`;
    }
    if (doc.status === "PAID" && !doc.receiptNumber) {
      const random = Math.floor(1000 + Math.random() * 9000);
      doc.receiptNumber = `RCPT-${year}-${random}`;
      doc.receiptDate = doc.receiptDate || new Date();
    }
    if (doc.status === "PAID") doc.paymentStatus = "paid";
    else if (doc.status === "FAILED") doc.paymentStatus = "failed";
    else if (doc.status === "CANCELLED") doc.paymentStatus = "cancelled";
    else doc.paymentStatus = "pending";
  }
  
  if (modelName === "Shipment") {
    if (!doc.shipmentNumber) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
      doc.shipmentNumber = `SHP-${year}${month}-${timestamp}${random}`;
    }
    const totalAmount = doc.pricing?.totalAmount || 0;
    if (!doc.finalPrice && totalAmount > 0) {
      doc.finalPrice = totalAmount;
    }
    if (doc.finalPrice > 0 && !totalAmount) {
      doc.pricing = doc.pricing || {};
      doc.pricing.totalAmount = doc.finalPrice;
    }
    doc.pricing = doc.pricing || {};
    doc.pricing.currency = "ETB";
  }
  
  if (modelName === "Trip") {
    if (!doc.tripNumber) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const timestamp = Date.now().toString().slice(-5);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
      doc.tripNumber = `TRP-${year}${month}-${timestamp}${random}`;
    }
  }
}

// Convert Mongoose Query syntax ({ email, status: { $in: [...] } }) to Prisma filter syntax
function convertMongoQueryToPrisma(query) {
  if (!query || typeof query !== "object") return {};
  const where = {};
  
  for (let [key, val] of Object.entries(query)) {
    if (key === "_id") key = "id";
    const mappedKey = mapMongoKeyToPrisma(key);
    
    if (mappedKey === "$or") {
      where.OR = val.map(sub => convertMongoQueryToPrisma(sub));
      continue;
    }
    if (mappedKey === "$and") {
      where.AND = val.map(sub => convertMongoQueryToPrisma(sub));
      continue;
    }

    if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
      const condition = {};
      for (const [op, opVal] of Object.entries(val)) {
        if (op === "$eq") {
          condition.equals = opVal;
        } else if (op === "$ne") {
          if (opVal && typeof opVal === "object" && opVal._id) {
            condition.not = String(opVal._id);
          } else {
            condition.not = opVal;
          }
        } else if (op === "$gt") {
          condition.gt = opVal;
        } else if (op === "$gte") {
          condition.gte = opVal;
        } else if (op === "$lt") {
          condition.lt = opVal;
        } else if (op === "$lte") {
          condition.lte = opVal;
        } else if (op === "$in") {
          condition.in = opVal.map(item => (item && item._id ? String(item._id) : item));
        } else if (op === "$nin") {
          condition.notIn = opVal.map(item => (item && item._id ? String(item._id) : item));
        } else if (op === "$regex") {
          condition.contains = opVal;
          condition.mode = "insensitive";
        }
      }
      where[mappedKey] = condition;
    } else {
      if (val && typeof val === "object" && val._id) {
        where[mappedKey] = String(val._id);
      } else {
        where[mappedKey] = val;
      }
    }
  }
  return where;
}

// Chainable query builder mirroring Mongoose API
class QueryChain {
  constructor(prismaDelegate, modelName, execType, queryObj = {}) {
    this.prismaDelegate = prismaDelegate;
    this.modelName = modelName;
    this.execType = execType; // 'find', 'findOne', 'count'
    this.where = convertMongoQueryToPrisma(queryObj);
    this._populate = [];
    this._sort = null;
    this._limit = null;
    this._skip = null;
    this._selectFields = null;
  }

  populate(pathSpec) {
    if (typeof pathSpec === "string") {
      this._populate.push({ path: pathSpec });
    } else if (typeof pathSpec === "object" && pathSpec.path) {
      this._populate.push(pathSpec);
    }
    return this;
  }

  sort(sortSpec) {
    this._sort = sortSpec;
    return this;
  }

  limit(limitVal) {
    this._limit = Number(limitVal);
    return this;
  }

  skip(skipVal) {
    this._skip = Number(skipVal);
    return this;
  }

  select(selectVal) {
    this._selectFields = selectVal;
    return this;
  }

  lean() {
    return this; // Always lean by default
  }

  async then(onfulfilled, onrejected) {
    try {
      const result = await this.exec();
      return onfulfilled(result);
    } catch (err) {
      if (onrejected) return onrejected(err);
      throw err;
    }
  }

  async exec() {
    const queryArgs = { where: this.where };
    
    // Apply sorting
    if (this._sort) {
      let sortObj = this._sort;
      if (typeof sortObj === "string") {
        const parts = sortObj.trim().split(/\s+/);
        queryArgs.orderBy = parts.map(p => {
          if (p.startsWith("-")) {
            return { [p.slice(1)]: "desc" };
          }
          return { [p]: "asc" };
        });
      } else if (typeof sortObj === "object") {
        queryArgs.orderBy = Object.entries(sortObj).map(([k, v]) => {
          return { [k]: v === -1 || v === "desc" ? "desc" : "asc" };
        });
      }
    }

    // Apply pagination
    if (this._limit !== null && !isNaN(this._limit)) {
      queryArgs.take = this._limit;
    }
    if (this._skip !== null && !isNaN(this._skip)) {
      queryArgs.skip = this._skip;
    }

    // Apply relations (includes)
    const popMaps = POPULATE_MAPS[this.modelName] || {};
    if (this._populate.length > 0) {
      queryArgs.include = {};
      for (const p of this._populate) {
        const pSpec = popMaps[p.path];
        if (pSpec) {
          queryArgs.include[pSpec.relation] = true;
        }
      }
    }

    if (this.execType === "count") {
      return await this.prismaDelegate.count({ where: this.where });
    }

    if (this.execType === "findOne") {
      const item = await this.prismaDelegate.findFirst(queryArgs);
      if (!item) return null;
      
      const doc = toMongooseDoc(item, this.modelName);
      
      // Select fields filtering
      applySelectionFilter(doc, this._selectFields, this.modelName);
      
      return doc;
    }

    // Default to findMany
    const items = await this.prismaDelegate.findMany(queryArgs);
    const docs = items.map(item => toMongooseDoc(item, this.modelName));
    
    for (const doc of docs) {
      applySelectionFilter(doc, this._selectFields, this.modelName);
    }
    
    return docs;
  }
}

// Filter fields on target document based on select string (e.g. "+password" or "-password")
function applySelectionFilter(doc, selectStr, modelName) {
  if (!doc) return;

  // Handle default unselected fields (User password has select: false by default)
  let shouldIncludePassword = false;

  if (selectStr && typeof selectStr === "string") {
    const parts = selectStr.trim().split(/\s+/);
    
    // Check if password is explicitly included
    if (parts.includes("password") || parts.includes("+password")) {
      shouldIncludePassword = true;
    }

    const exclusions = parts.filter(p => p.startsWith("-")).map(p => p.slice(1));
    const inclusions = parts.filter(p => !p.startsWith("-") && !p.startsWith("+"));
    const additions = parts.filter(p => p.startsWith("+")).map(p => p.slice(1));

    if (exclusions.length > 0) {
      for (const field of exclusions) {
        delete doc[field];
      }
    } else if (inclusions.length > 0) {
      // Inclusion behavior: only keep specified fields + primary keys + additions
      const allowed = new Set([...inclusions, ...additions, "id", "_id", "_modelName"]);
      for (const key of Object.keys(doc)) {
        if (!allowed.has(key)) {
          delete doc[key];
        }
      }
    }
  }

  // If User model and password wasn't explicitly selected, exclude it by default
  if (modelName === "User" && !shouldIncludePassword) {
    delete doc.password;
  }
}

// Database helper functions for map/reduce aggregation inside JS
function getFieldValue(obj, path) {
  if (!path) return undefined;
  if (path === "_id") path = "id";
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

function setFieldValue(obj, path, val) {
  if (path === "_id") path = "id";
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = val;
}

function matchesQuery(doc, query) {
  if (!query || typeof query !== "object") return true;
  for (const [key, val] of Object.entries(query)) {
    if (key === "$or") {
      if (!Array.isArray(val) || val.length === 0) continue;
      const matched = val.some(sub => matchesQuery(doc, sub));
      if (!matched) return false;
      continue;
    }
    if (key === "$and") {
      if (!Array.isArray(val)) continue;
      const matched = val.every(sub => matchesQuery(doc, sub));
      if (!matched) return false;
      continue;
    }

    const docVal = getFieldValue(doc, key);
    if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
      for (const [op, opVal] of Object.entries(val)) {
        if (op === "$eq") {
          if (docVal !== opVal) return false;
        } else if (op === "$ne") {
          if (docVal === opVal) return false;
        } else if (op === "$gt") {
          if (!(docVal > opVal)) return false;
        } else if (op === "$gte") {
          if (!(docVal >= opVal)) return false;
        } else if (op === "$lt") {
          if (!(docVal < opVal)) return false;
        } else if (op === "$lte") {
          if (!(docVal <= opVal)) return false;
        } else if (op === "$in") {
          if (!Array.isArray(opVal)) return false;
          const matchStr = opVal.map(String);
          if (!matchStr.includes(String(docVal))) return false;
        } else if (op === "$nin") {
          if (!Array.isArray(opVal)) return false;
          const matchStr = opVal.map(String);
          if (matchStr.includes(String(docVal))) return false;
        } else if (op === "$regex") {
          const options = val.$options || "";
          const regex = new RegExp(opVal, options);
          if (!regex.test(String(docVal || ""))) return false;
        }
      }
    } else {
      if (String(docVal) !== String(val)) return false;
    }
  }
  return true;
}

function evaluateExpr(doc, expr) {
  if (typeof expr === "string" && expr.startsWith("$")) {
    return getFieldValue(doc, expr.slice(1));
  }
  if (expr && typeof expr === "object") {
    const op = Object.keys(expr)[0];
    const val = expr[op];
    if (op === "$year") {
      const dateVal = new Date(evaluateExpr(doc, val));
      return dateVal.getFullYear();
    }
    if (op === "$month") {
      const dateVal = new Date(evaluateExpr(doc, val));
      return dateVal.getMonth() + 1;
    }
  }
  return expr;
}

// In-memory aggregation stages running in JS
function groupData(data, spec) {
  const groups = {};
  const idExpr = spec._id;
  
  for (const doc of data) {
    let key;
    if (typeof idExpr === "string" && idExpr.startsWith("$")) {
      key = getFieldValue(doc, idExpr.slice(1));
    } else if (idExpr && typeof idExpr === "object") {
      key = {};
      for (const [k, expr] of Object.entries(idExpr)) {
        key[k] = evaluateExpr(doc, expr);
      }
      key = JSON.stringify(key);
    } else {
      key = null;
    }

    const groupKey = typeof key === "object" && key !== null ? JSON.stringify(key) : key;
    if (!groups[groupKey]) {
      groups[groupKey] = {
        _id: typeof key === "string" && key.startsWith("{") ? JSON.parse(key) : key,
        _docs: []
      };
    }
    groups[groupKey]._docs.push(doc);
  }

  const result = [];
  for (const group of Object.values(groups)) {
    const groupResult = { _id: group._id };
    for (const [field, accSpec] of Object.entries(spec)) {
      if (field === "_id") continue;
      const op = Object.keys(accSpec)[0];
      const valExpr = accSpec[op];
      
      if (op === "$sum") {
        let sum = 0;
        for (const doc of group._docs) {
          if (valExpr === 1) {
            sum += 1;
          } else if (typeof valExpr === "string" && valExpr.startsWith("$")) {
            sum += (Number(getFieldValue(doc, valExpr.slice(1))) || 0);
          }
        }
        groupResult[field] = sum;
      } else if (op === "$avg") {
        let sum = 0;
        let count = 0;
        for (const doc of group._docs) {
          if (typeof valExpr === "string" && valExpr.startsWith("$")) {
            sum += (Number(getFieldValue(doc, valExpr.slice(1))) || 0);
            count++;
          }
        }
        groupResult[field] = count > 0 ? sum / count : 0;
      }
    }
    result.push(groupResult);
  }
  return result;
}

async function lookupData(data, spec) {
  const modelMap = {
    users: "User",
    customers: "Customer",
    drivers: "Driver",
    vehicles: "Vehicle",
    shipments: "Shipment",
    trips: "Trip",
    payments: "Payment",
    notifications: "Notification",
    maintenances: "Maintenance"
  };
  const modelName = modelMap[spec.from];
  if (!modelName) return data;

  const targetModel = makeModel(modelName);
  
  const localField = spec.localField === "_id" ? "id" : spec.localField;
  const foreignField = spec.foreignField === "_id" ? "id" : spec.foreignField;

  const localVals = data.map(d => getFieldValue(d, localField)).filter(v => v !== undefined && v !== null);
  if (localVals.length === 0) {
    for (const d of data) {
      d[spec.as] = [];
    }
    return data;
  }

  const foreignDocs = await targetModel.find({
    [foreignField]: { $in: localVals }
  });

  for (const d of data) {
    const localVal = getFieldValue(d, localField);
    const matches = foreignDocs.filter(fd => String(getFieldValue(fd, foreignField)) === String(localVal));
    d[spec.as] = matches;
  }
  return data;
}

function unwindData(data, spec) {
  const path = typeof spec === "string" ? spec.slice(1) : spec.path.slice(1);
  const result = [];
  for (const d of data) {
    const val = getFieldValue(d, path);
    if (Array.isArray(val)) {
      for (const item of val) {
        const copy = { ...d };
        setFieldValue(copy, path, item);
        result.push(copy);
      }
    } else if (val !== null && val !== undefined) {
      const copy = { ...d };
      result.push(copy);
    }
  }
  return result;
}

function projectData(data, spec) {
  const result = [];
  for (const d of data) {
    const projected = {};
    for (const [k, v] of Object.entries(spec)) {
      if (v === 1 || v === true) {
        projected[k] = d[k];
      } else if (typeof v === "string" && v.startsWith("$")) {
        projected[k] = getFieldValue(d, v.slice(1));
      } else {
        projected[k] = v;
      }
    }
    result.push(projected);
  }
  return result;
}

function sortData(data, spec) {
  const sorted = [...data];
  sorted.sort((a, b) => {
    for (const [k, v] of Object.entries(spec)) {
      const valA = getFieldValue(a, k);
      const valB = getFieldValue(b, k);
      const multiplier = v === -1 || v === "desc" ? -1 : 1;
      if (valA < valB) return -1 * multiplier;
      if (valA > valB) return 1 * multiplier;
    }
    return 0;
  });
  return sorted;
}

// Singleton instances for models to avoid multiple definition errors
const modelInstances = {};

function makeModel(modelName) {
  if (modelInstances[modelName]) {
    return modelInstances[modelName];
  }

  // Map backend models to Prisma delegates
  const delegateName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const prismaDelegate = prisma[delegateName];

  if (!prismaDelegate) {
    throw new Error(`Prisma delegate for model ${modelName} not found!`);
  }

  const modelObject = {
    prismaDelegate,
    modelName,

    find(queryObj = {}) {
      return new QueryChain(prismaDelegate, modelName, "find", queryObj);
    },

    findOne(queryObj = {}) {
      return new QueryChain(prismaDelegate, modelName, "findOne", queryObj);
    },

    findById(id) {
      const cleanId = typeof id === "object" && id !== null ? String(id._id || id) : String(id);
      return new QueryChain(prismaDelegate, modelName, "findOne", { _id: cleanId });
    },

    async create(data) {
      const isArray = Array.isArray(data);
      const docs = isArray ? data : [data];
      const savedDocs = [];
      
      for (const rawDoc of docs) {
        const wrappedDoc = new Document(rawDoc, modelName);
        await runPreSaveHooks(wrappedDoc, modelName);
        const dbData = toDbObj(wrappedDoc, modelName);
        
        const saved = await prismaDelegate.create({ data: dbData });
        savedDocs.push(toMongooseDoc(saved, modelName));
      }
      
      return isArray ? savedDocs : savedDocs[0];
    },

    async findByIdAndUpdate(id, updateData, options = {}) {
      const cleanId = typeof id === "object" && id !== null ? String(id._id || id) : String(id);
      const dbUpdate = toDbObj(updateData, modelName);
      
      // Remove id from update if present
      delete dbUpdate.id;
      
      // Perform update in DB
      const updated = await prismaDelegate.update({
        where: { id: cleanId },
        data: dbUpdate,
      });
      
      return toMongooseDoc(updated, modelName);
    },

    async findByIdAndDelete(id) {
      const cleanId = typeof id === "object" && id !== null ? String(id._id || id) : String(id);
      try {
        const deleted = await prismaDelegate.delete({
          where: { id: cleanId }
        });
        return toMongooseDoc(deleted, modelName);
      } catch (err) {
        return null;
      }
    },

    async findOneAndDelete(queryObj) {
      const where = convertMongoQueryToPrisma(queryObj);
      try {
        const match = await prismaDelegate.findFirst({ where });
        if (!match) return null;
        const deleted = await prismaDelegate.delete({
          where: { id: match.id }
        });
        return toMongooseDoc(deleted, modelName);
      } catch (err) {
        return null;
      }
    },

    countDocuments(queryObj = {}) {
      return new QueryChain(prismaDelegate, modelName, "count", queryObj);
    },

    async updateOne(queryObj, updateData) {
      const where = convertMongoQueryToPrisma(queryObj);
      const dbUpdate = toDbObj(updateData, modelName);
      delete dbUpdate.id;

      const first = await prismaDelegate.findFirst({ where });
      if (!first) return { matchedCount: 0, modifiedCount: 0 };

      await prismaDelegate.update({
        where: { id: first.id },
        data: dbUpdate,
      });
      return { matchedCount: 1, modifiedCount: 1 };
    },

    async updateMany(queryObj, updateData) {
      const where = convertMongoQueryToPrisma(queryObj);
      const dbUpdate = toDbObj(updateData, modelName);
      delete dbUpdate.id;

      const res = await prismaDelegate.updateMany({
        where,
        data: dbUpdate,
      });
      return { matchedCount: res.count, modifiedCount: res.count };
    },

    async deleteMany(queryObj = {}) {
      const where = convertMongoQueryToPrisma(queryObj);
      const res = await prismaDelegate.deleteMany({ where });
      return { deletedCount: res.count };
    },

    // In-memory JS Map-Reduce Aggregator Engine
    async aggregate(pipeline = []) {
      let queryArgs = {};
      
      // Look for $match filter to fetch only necessary records
      for (const stage of pipeline) {
        if (stage.$match) {
          queryArgs.where = convertMongoQueryToPrisma(stage.$match);
          break;
        }
      }

      // Automatically include populated relations to support lookup stages
      queryArgs.include = {};
      const popMaps = POPULATE_MAPS[modelName] || {};
      for (const [key, pSpec] of Object.entries(popMaps)) {
        queryArgs.include[pSpec.relation] = true;
      }

      let data = await prismaDelegate.findMany(queryArgs);
      let docs = data.map(item => toMongooseDoc(item, modelName).toObject());

      // Run remaining aggregation pipeline stages in-memory
      for (const stage of pipeline) {
        if (stage.$match) {
          docs = docs.filter(d => matchesQuery(d, stage.$match));
        } else if (stage.$group) {
          docs = groupData(docs, stage.$group);
        } else if (stage.$sort) {
          docs = sortData(docs, stage.$sort);
        } else if (stage.$lookup) {
          docs = await lookupData(docs, stage.$lookup);
        } else if (stage.$unwind) {
          docs = unwindData(docs, stage.$unwind);
        } else if (stage.$project) {
          docs = projectData(docs, stage.$project);
        }
      }

      return docs;
    }
  };

  modelInstances[modelName] = modelObject;
  return modelObject;
}

module.exports = makeModel;
