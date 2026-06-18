export interface CustomerByPhone {
  id?: string;
  fullName?: string;
  name?: string;
  phone: string;
  email?: string;
  totalPoints?: number;
  points?: number;
  membershipLevel?: string;
  membershipDiscountRate?: number;
  discountRate?: number;
  status?: string;
}

export interface CreateCustomerRequest {
  fullName: string;
  phone: string;
  email?: string;
}
