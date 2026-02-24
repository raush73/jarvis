import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerContactDto, CustomerContactRole } from './dto/create-customer-contact.dto';
import { UpdateCustomerContactDto } from './dto/update-customer-contact.dto';

/**
 * CUST-REL-01: Customer Contacts Service
 * Universal customer-side contacts (no PM entity)
 * Structure only — no commission logic.
 */
@Injectable()
export class CustomerContactsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new customer contact
   */
  async create(dto: CreateCustomerContactDto) {
    // Validate customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      select: { id: true },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    // Validate salesperson exists if provided
    if (dto.salespersonOfRecordUserId) {
      const salesperson = await this.prisma.user.findUnique({
        where: { id: dto.salespersonOfRecordUserId },
        select: { id: true },
      });

      if (!salesperson) {
        throw new BadRequestException('Salesperson user not found');
      }
    }

    // Convert roles array to JSON string for SQLite storage
    const rolesJson = dto.roles ? JSON.stringify(dto.roles) : '[]';

    const contact = await this.prisma.customerContact.create({
      data: {
        customerId: dto.customerId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        officePhone: dto.officePhone,
        cellPhone: dto.cellPhone,
        jobTitle: dto.jobTitle,
        rolesJson,
        salespersonOfRecordUserId: dto.salespersonOfRecordUserId,
        isActive: dto.isActive ?? true,
      },
      select: {
        id: true,
        customerId: true,
        firstName: true,
        lastName: true,
        email: true,
        officePhone: true,
        cellPhone: true,
        jobTitle: true,
        rolesJson: true,
        salespersonOfRecordUserId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        salespersonOfRecord: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return this.transformContact(contact);
  }

  /**
   * Find all contacts for a customer
   */
  async findByCustomer(customerId: string, includeInactive = false) {
    const contacts = await this.prisma.customerContact.findMany({
      where: {
        customerId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        customerId: true,
        firstName: true,
        lastName: true,
        email: true,
        officePhone: true,
        cellPhone: true,
        jobTitle: true,
        rolesJson: true,
        salespersonOfRecordUserId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        salespersonOfRecord: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return contacts.map((c) => this.transformContact(c));
  }

  /**
   * Find a single contact by ID
   */
  async findOne(id: string) {
    const contact = await this.prisma.customerContact.findUnique({
      where: { id },
      select: {
        id: true,
        customerId: true,
        firstName: true,
        lastName: true,
        email: true,
        officePhone: true,
        cellPhone: true,
        jobTitle: true,
        rolesJson: true,
        salespersonOfRecordUserId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        salespersonOfRecord: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Customer contact not found');
    }

    return this.transformContact(contact);
  }

  /**
   * Update a customer contact
   */
  async update(id: string, dto: UpdateCustomerContactDto) {
    // Verify contact exists
    const existing = await this.prisma.customerContact.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Customer contact not found');
    }

    // Validate salesperson exists if provided
    if (dto.salespersonOfRecordUserId) {
      const salesperson = await this.prisma.user.findUnique({
        where: { id: dto.salespersonOfRecordUserId },
        select: { id: true },
      });

      if (!salesperson) {
        throw new BadRequestException('Salesperson user not found');
      }
    }

    const updateData: Record<string, unknown> = {};

    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.officePhone !== undefined) updateData.officePhone = dto.officePhone;
    if (dto.cellPhone !== undefined) updateData.cellPhone = dto.cellPhone;
    if (dto.jobTitle !== undefined) updateData.jobTitle = dto.jobTitle;
    if (dto.roles !== undefined) updateData.rolesJson = JSON.stringify(dto.roles);
    if (dto.salespersonOfRecordUserId !== undefined) {
      updateData.salespersonOfRecordUserId = dto.salespersonOfRecordUserId;
    }
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const contact = await this.prisma.customerContact.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        customerId: true,
        firstName: true,
        lastName: true,
        email: true,
        officePhone: true,
        cellPhone: true,
        jobTitle: true,
        rolesJson: true,
        salespersonOfRecordUserId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        salespersonOfRecord: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return this.transformContact(contact);
  }

  /**
   * Soft-delete (deactivate) a contact
   */
  async deactivate(id: string) {
    const existing = await this.prisma.customerContact.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Customer contact not found');
    }

    const contact = await this.prisma.customerContact.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        customerId: true,
        firstName: true,
        lastName: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return contact;
  }

  /**
   * Transform contact from DB representation to API response
   * Parses rolesJson into roles array
   */
  private transformContact(contact: {
    rolesJson: string;
    [key: string]: unknown;
  }) {
    const { rolesJson, ...rest } = contact;
    let roles: CustomerContactRole[] = [];

    try {
      roles = JSON.parse(rolesJson) as CustomerContactRole[];
    } catch {
      roles = [];
    }

    return {
      ...rest,
      roles,
    };
  }
}

