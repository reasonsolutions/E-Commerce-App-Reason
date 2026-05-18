import { UserSession } from '../interfaces';

// Raw shape stored by loginCustomer — matches LoggedInCustomerInterface
interface RawSession {
  CustomerProfileCode?: number;
  CustomerName?: string;
  EmailID?: string;
  MobileNumber?: number | string;
  Address?: string;
  StreetName?: string;
  CityName?: string;
  Zipcode?: number | string;
  CountryCode?: number | string;
  CartDetailsCount?: number;
}

export function adaptSession(raw: unknown): UserSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as RawSession;
  if (!r.CustomerProfileCode) return null;

  return {
    profileCode: r.CustomerProfileCode,
    name:        r.CustomerName   ?? '',
    email:       r.EmailID        ?? '',
    mobile:      r.MobileNumber !== undefined ? String(r.MobileNumber) : '',
    address:     r.Address        ?? '',
    streetName:  r.StreetName     ?? '',
    city:        r.CityName       ?? '',
    postcode:    r.Zipcode !== undefined ? String(r.Zipcode) : '',
    countryCode: r.CountryCode !== undefined ? String(r.CountryCode) : '',
  };
}
