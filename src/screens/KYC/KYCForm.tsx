import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { addCustomer, addKYCDocument, generateCustomerId, generateId, getCustomerByAadhaar } from '@/services/localDB';
import { INDIAN_STATES, OCCUPATIONS, GENDER_OPTIONS } from '@/constants';
import { Customer, KYCDocument } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  User,
  Phone,
  CreditCard,
  MapPin,
  Briefcase,
  Upload,
  Camera,
  Check,
  X,
  AlertCircle,
  ArrowLeft,
  Save,
} from 'lucide-react';

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  aadhaarNumber: string;
  address: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
  occupation: string;
  annualIncome: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
}

interface UploadedDoc {
  type: KYCDocument['type'];
  fileName: string;
  fileData: string;
}

export default function KYCForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshSyncCount } = useApp();
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    aadhaarNumber: '',
    address: '',
    village: '',
    district: '',
    state: 'Maharashtra',
    pincode: '',
    occupation: '',
    annualIncome: '',
    dateOfBirth: '',
    gender: 'male',
  });

  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const aadhaarFrontRef = useRef<HTMLInputElement>(null);
  const aadhaarBackRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const validateAadhaar = (aadhaar: string): boolean => {
    return /^\d{12}$/.test(aadhaar);
  };

  const validatePhone = (phone: string): boolean => {
    return /^[6-9]\d{9}$/.test(phone);
  };

  const validatePincode = (pincode: string): boolean => {
    return /^\d{6}$/.test(pincode);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFileUpload = async (type: KYCDocument['type'], file: File) => {
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed.');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setDocuments((prev) => {
        // Remove existing document of same type
        const filtered = prev.filter((d) => d.type !== type);
        return [...filtered, { type, fileName: file.name, fileData: base64 }];
      });
      toast.success(`${type.replace('_', ' ')} uploaded successfully`);
    };
    reader.readAsDataURL(file);
  };

  const removeDocument = (type: KYCDocument['type']) => {
    setDocuments((prev) => prev.filter((d) => d.type !== type));
  };

  const getDocumentByType = (type: KYCDocument['type']) => {
    return documents.find((d) => d.type === type);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Enter a valid 10-digit mobile number';
    }
    if (!validateAadhaar(formData.aadhaarNumber)) {
      newErrors.aadhaarNumber = 'Enter a valid 12-digit Aadhaar number';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.village.trim()) {
      newErrors.village = 'Village/Town is required';
    }
    if (!formData.district.trim()) {
      newErrors.district = 'District is required';
    }
    if (!validatePincode(formData.pincode)) {
      newErrors.pincode = 'Enter a valid 6-digit pincode';
    }
    if (!formData.occupation) {
      newErrors.occupation = 'Select an occupation';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (documents.length === 0) {
      toast.error('Please upload at least one KYC document');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check for duplicate Aadhaar
      const existing = await getCustomerByAadhaar(formData.aadhaarNumber);
      if (existing) {
        setSubmitError('A customer with this Aadhaar number already exists');
        setIsSubmitting(false);
        return;
      }

      // Create customer
      const customerId = await generateCustomerId();
      const customer: Customer = {
        id: customerId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone,
        aadhaarNumber: formData.aadhaarNumber,
        address: formData.address.trim(),
        village: formData.village.trim(),
        district: formData.district.trim(),
        state: formData.state,
        pincode: formData.pincode,
        occupation: formData.occupation,
        annualIncome: parseFloat(formData.annualIncome) || 0,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        createdAt: new Date().toISOString(),
        createdBy: user?.id || '',
        status: 'pending',
        syncStatus: 'pending',
      };

      await addCustomer(customer);

      // Add KYC documents
      for (const doc of documents) {
        const kycDoc: KYCDocument = {
          id: generateId('kyc'),
          customerId,
          type: doc.type,
          fileName: doc.fileName,
          fileData: doc.fileData,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user?.id || '',
          status: 'pending',
          syncStatus: 'pending',
        };
        await addKYCDocument(kycDoc);
      }

      await refreshSyncCount();
      toast.success(`Customer registered successfully. Customer ID: ${customerId}`);
      navigate('/kyc');
    } catch (error) {
      console.error('Error saving customer:', error);
      setSubmitError('Failed to save customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/kyc')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="page-title">New Customer Registration</h1>
          <p className="page-subtitle">Complete KYC onboarding for a new customer</p>
        </div>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>Basic details of the customer</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Enter first name"
                className={errors.firstName ? 'border-destructive' : ''}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Enter last name"
                className={errors.lastName ? 'border-destructive' : ''}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleInputChange('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={errors.dateOfBirth ? 'border-destructive' : ''}
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-destructive">{errors.dateOfBirth}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile"
                  className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="aadhaar">Aadhaar Number *</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="aadhaar"
                  value={formData.aadhaarNumber}
                  onChange={(e) => handleInputChange('aadhaarNumber', e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="12-digit Aadhaar"
                  className={`pl-10 ${errors.aadhaarNumber ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.aadhaarNumber && (
                <p className="text-xs text-destructive">{errors.aadhaarNumber}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Address Details
            </CardTitle>
            <CardDescription>Residential address for verification</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Full Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="House/Plot No., Street, Landmark"
                className={errors.address ? 'border-destructive' : ''}
                rows={2}
              />
              {errors.address && (
                <p className="text-xs text-destructive">{errors.address}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="village">Village/Town *</Label>
                <Input
                  id="village"
                  value={formData.village}
                  onChange={(e) => handleInputChange('village', e.target.value)}
                  placeholder="Enter village or town"
                  className={errors.village ? 'border-destructive' : ''}
                />
                {errors.village && (
                  <p className="text-xs text-destructive">{errors.village}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">District *</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  placeholder="Enter district"
                  className={errors.district ? 'border-destructive' : ''}
                />
                {errors.district && (
                  <p className="text-xs text-destructive">{errors.district}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => handleInputChange('state', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit pincode"
                  className={errors.pincode ? 'border-destructive' : ''}
                />
                {errors.pincode && (
                  <p className="text-xs text-destructive">{errors.pincode}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Occupation & Income */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Occupation & Income
            </CardTitle>
            <CardDescription>Employment and financial details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation *</Label>
              <Select
                value={formData.occupation}
                onValueChange={(value) => handleInputChange('occupation', value)}
              >
                <SelectTrigger className={errors.occupation ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select occupation" />
                </SelectTrigger>
                <SelectContent>
                  {OCCUPATIONS.map((occ) => (
                    <SelectItem key={occ} value={occ}>
                      {occ}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.occupation && (
                <p className="text-xs text-destructive">{errors.occupation}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="income">Annual Income (₹)</Label>
              <Input
                id="income"
                type="number"
                value={formData.annualIncome}
                onChange={(e) => handleInputChange('annualIncome', e.target.value)}
                placeholder="Enter annual income"
                min="0"
              />
            </div>
          </CardContent>
        </Card>

        {/* KYC Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              KYC Documents
            </CardTitle>
            <CardDescription>Upload identity proof documents (Max 5MB each)</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {/* Aadhaar Front */}
            <div className="space-y-2">
              <Label>Aadhaar Front *</Label>
              <input
                type="file"
                ref={aadhaarFrontRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload('aadhaar_front', file);
                }}
              />
              {getDocumentByType('aadhaar_front') ? (
                <div className="relative border-2 border-success rounded-lg p-4 bg-success/5">
                  <img
                    src={getDocumentByType('aadhaar_front')?.fileData}
                    alt="Aadhaar Front"
                    className="w-full h-32 object-cover rounded"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-success flex items-center gap-1">
                      <Check className="w-3 h-3" /> Uploaded
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument('aadhaar_front')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-32 border-dashed"
                  onClick={() => aadhaarFrontRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload Front</span>
                  </div>
                </Button>
              )}
            </div>

            {/* Aadhaar Back */}
            <div className="space-y-2">
              <Label>Aadhaar Back *</Label>
              <input
                type="file"
                ref={aadhaarBackRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload('aadhaar_back', file);
                }}
              />
              {getDocumentByType('aadhaar_back') ? (
                <div className="relative border-2 border-success rounded-lg p-4 bg-success/5">
                  <img
                    src={getDocumentByType('aadhaar_back')?.fileData}
                    alt="Aadhaar Back"
                    className="w-full h-32 object-cover rounded"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-success flex items-center gap-1">
                      <Check className="w-3 h-3" /> Uploaded
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument('aadhaar_back')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-32 border-dashed"
                  onClick={() => aadhaarBackRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload Back</span>
                  </div>
                </Button>
              )}
            </div>

            {/* Selfie */}
            <div className="space-y-2">
              <Label>Customer Selfie *</Label>
              <input
                type="file"
                ref={selfieRef}
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload('selfie', file);
                }}
              />
              {getDocumentByType('selfie') ? (
                <div className="relative border-2 border-success rounded-lg p-4 bg-success/5">
                  <img
                    src={getDocumentByType('selfie')?.fileData}
                    alt="Customer Selfie"
                    className="w-full h-32 object-cover rounded"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-success flex items-center gap-1">
                      <Check className="w-3 h-3" /> Uploaded
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument('selfie')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-32 border-dashed"
                  onClick={() => selfieRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Take Photo</span>
                  </div>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/kyc')}>
            Cancel
          </Button>
          <Button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save & Queue for Sync
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
