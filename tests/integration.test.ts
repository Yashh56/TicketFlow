import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';

describe('Support Ticket Management System - End-to-End Test Suite', () => {
  let userToken: string;
  let userId: string;
  let user2Token: string;
  let adminToken: string;
  let adminId: string;
  let createdTicketId: string;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    // Allow any pending async event listeners to flush before closing connection
    await new Promise((resolve) => setTimeout(resolve, 200));
    await disconnectDB();
  });

  describe('Health Check API', () => {
    it('should return 200 OK on /api/health', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('support-ticket-management-system');
    });
  });

  describe('Authentication & RBAC', () => {
    it('should register a normal user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice User',
          email: 'alice@example.com',
          password: 'password123',
          role: 'USER'
        });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('USER');
      userToken = res.body.token;
      userId = res.body.user.id;
    });

    it('should reject registration with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Alice',
          email: 'alice@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email already registered');
    });

    it('should register a second normal user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bob User',
          email: 'bob@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(201);
      user2Token = res.body.token;
    });

    it('should register an admin user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Admin Chief',
          email: 'admin@example.com',
          password: 'adminpassword123',
          role: 'ADMIN'
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('ADMIN');
      adminToken = res.body.token;
      adminId = res.body.user.id;
    });

    it('should successfully log in', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('should fail log in with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
    });

    it('should get current profile on /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('alice@example.com');
    });

    it('should reject unauthenticated request on /api/auth/me', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('Ticket Management Lifecycle', () => {
    it('should allow user to create a new ticket', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Database connection latency spike',
          description: 'Experiencing intermittent delays when querying support records.',
          category: 'TECHNICAL',
          priority: 'HIGH'
        });

      expect(res.status).toBe(201);
      expect(res.body.ticket).toBeDefined();
      expect(res.body.ticket.status).toBe('OPEN');
      expect(res.body.ticket.priority).toBe('HIGH');
      createdTicketId = res.body.ticket._id;
    });

    it('should allow creator to view their ticket by ID', async () => {
      const res = await request(app)
        .get(`/api/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ticket._id).toBe(createdTicketId);
      expect(res.body.ticket.title).toBe('Database connection latency spike');
    });

    it('should forbid other user from viewing the ticket', async () => {
      const res = await request(app)
        .get(`/api/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
    });

    it('should allow user to update their own ticket', async () => {
      const res = await request(app)
        .put(`/api/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Database connection latency spike - High Priority',
          description: 'Experiencing intermittent delays in cluster us-east.'
        });

      expect(res.status).toBe(200);
      expect(res.body.ticket.title).toBe('Database connection latency spike - High Priority');
    });

    it('should allow user to see only their tickets in list', async () => {
      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tickets.length).toBe(1);
      expect(res.body.pagination.total).toBe(1);
    });

    it('should allow admin to view all tickets', async () => {
      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tickets.length).toBeGreaterThanOrEqual(1);
    });

    it('should support search and filtering', async () => {
      const res = await request(app)
        .get('/api/tickets?search=latency&status=OPEN')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tickets.length).toBe(1);
    });

    it('should allow admin to update ticket status to IN_PROGRESS and assign to themselves', async () => {
      const res = await request(app)
        .patch(`/api/tickets/${createdTicketId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'IN_PROGRESS',
          assignedTo: adminId
        });

      expect(res.status).toBe(200);
      expect(res.body.ticket.status).toBe('IN_PROGRESS');
      expect(res.body.ticket.assignedTo._id).toBe(adminId);
    });
  });

  describe('Comments & Event Workflow', () => {
    it('should allow creator to add a comment', async () => {
      const res = await request(app)
        .post(`/api/tickets/${createdTicketId}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: 'Here are the diagnostic logs from the client side.'
        });

      expect(res.status).toBe(201);
      expect(res.body.comment.content).toBe('Here are the diagnostic logs from the client side.');
    });

    it('should allow admin to add a response comment', async () => {
      const res = await request(app)
        .post(`/api/tickets/${createdTicketId}/comments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'We investigated the replicas and applied an index optimization.'
        });

      expect(res.status).toBe(201);
      expect(res.body.comment.userId.name).toBe('Admin Chief');
    });

    it('should retrieve all comments for the ticket in chronological order', async () => {
      const res = await request(app)
        .get(`/api/tickets/${createdTicketId}/comments`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.comments.length).toBe(2);
      expect(res.body.comments[0].content).toContain('diagnostic logs');
      expect(res.body.comments[1].content).toContain('index optimization');
    });

    it('should allow admin to resolve the ticket', async () => {
      const res = await request(app)
        .patch(`/api/tickets/${createdTicketId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'RESOLVED'
        });

      expect(res.status).toBe(200);
      expect(res.body.ticket.status).toBe('RESOLVED');
    });

    it('should have dispatched notification to the user upon resolution', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.notifications.length).toBeGreaterThan(0);
      const resolutionNotice = res.body.notifications.find(
        (n: any) => n.title === 'Support Ticket Resolved'
      );
      expect(resolutionNotice).toBeDefined();
    });

    it('should not allow user to delete a resolved ticket', async () => {
      const res = await request(app)
        .delete(`/api/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Cannot delete a ticket');
    });
  });

  describe('Admin Dashboard & Audit Feed', () => {
    it('should reject non-admin from accessing /api/admin/stats', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to view dashboard statistics', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.overview.totalTickets).toBeGreaterThanOrEqual(1);
      expect(res.body.overview.resolvedTickets).toBeGreaterThanOrEqual(1);
      expect(res.body.distribution.byStatus).toBeDefined();
      expect(res.body.distribution.byPriority).toBeDefined();
      expect(res.body.recentActivities.length).toBeGreaterThan(0);
    });

    it('should allow admin to retrieve activity audit logs', async () => {
      const res = await request(app)
        .get(`/api/admin/activities?ticketId=${createdTicketId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.activities.length).toBeGreaterThan(0);
      const actions = res.body.activities.map((a: any) => a.action);
      expect(actions).toContain('TICKET_CREATED');
      expect(actions).toContain('STATUS_CHANGED');
      expect(actions).toContain('COMMENT_ADDED');
    });

    it('should allow admin to delete any ticket', async () => {
      const res = await request(app)
        .delete(`/api/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Ticket deleted successfully');
    });
  });
});
