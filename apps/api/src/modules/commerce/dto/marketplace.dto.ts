import { IsString, IsOptional, IsNumber, IsEnum, IsArray, Min, Max, IsUUID, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ListingStatus, LicenseType, UpdatePolicy } from '@prisma/client';

// ============================================================
// Query / Filters
// ============================================================

export class MarketplaceQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(LicenseType)
  licenseType?: LicenseType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  sort?: 'newest' | 'popular' | 'rating' | 'price_asc' | 'price_desc';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;
}

// ============================================================
// Create / Update Listing
// ============================================================

export class CreateListingDto {
  @IsUUID()
  scenarioId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsEnum(LicenseType)
  licenseType?: LicenseType;

  @IsOptional()
  @IsEnum(UpdatePolicy)
  updatePolicy?: UpdatePolicy;
}

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(LicenseType)
  licenseType?: LicenseType;

  @IsOptional()
  @IsEnum(UpdatePolicy)
  updatePolicy?: UpdatePolicy;
}

// ============================================================
// Purchase
// ============================================================

export class PurchaseDto {
  @IsUUID()
  listingId!: string;

  @IsOptional()
  @IsEnum(LicenseType)
  licenseType?: LicenseType;

  @IsOptional()
  @IsString()
  promoCode?: string;
}

// ============================================================
// Review
// ============================================================

export class CreateReviewDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  text?: string;
}

// ============================================================
// Cart
// ============================================================

export class AddToCartDto {
  @IsUUID()
  listingId!: string;

  @IsOptional()
  @IsEnum(LicenseType)
  licenseType?: LicenseType;
}

// ============================================================
// Promo
// ============================================================

export class ValidatePromoDto {
  @IsString()
  code!: string;

  @IsUUID()
  listingId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;
}

// ============================================================
// Payout
// ============================================================

export class RequestPayoutDto {
  @Type(() => Number)
  @IsNumber()
  @Min(100)
  amount!: number;
}

// ============================================================
// Admin
// ============================================================

export class ModerateListingDto {
  @IsEnum(ListingStatus)
  status!: ListingStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class ModerateReviewDto {
  @IsString()
  reviewId!: string;

  @IsBoolean()
  approved!: boolean;
}