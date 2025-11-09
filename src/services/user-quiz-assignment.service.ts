import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserQuizAssignment } from '../entities/user-quiz-assignment.entity';
import { User } from '../entities/user.entity';
import { Quiz } from '../entities/quiz.entity';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import { ApiResponse, ResponseFactory } from '../interfaces/api-response.interface';

export class CreateUserQuizAssignmentDto {
  userId: number;
  quizId: number;
  isActive?: boolean;
}

export class UserQuizAssignmentResponseDto {
  id: number;
  userId: number;
  quizId: number;
  isActive: boolean;
  assignedBy: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  user?: any;
  quiz?: any;
}

@Injectable()
export class UserQuizAssignmentService {
  constructor(
    @InjectRepository(UserQuizAssignment)
    private readonly userQuizAssignmentRepository: Repository<UserQuizAssignment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
  ) {}

  async create(createDto: CreateUserQuizAssignmentDto, assignedBy: string): Promise<UserQuizAssignmentResponseDto> {
    try {
      // Validate that user exists and is an admin
      const user = await this.userRepository.findOne({ 
        where: { id: createDto.userId } 
      });
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role !== 'admin') {
        throw new BadRequestException('Only admin users can be assigned to quizzes');
      }

      // Validate that quiz exists
      const quiz = await this.quizRepository.findOne({ 
        where: { id: createDto.quizId } 
      });
      
      if (!quiz) {
        throw new NotFoundException('Quiz not found');
      }

      // Check if assignment already exists
      const existingAssignment = await this.userQuizAssignmentRepository.findOne({
        where: { 
          userId: createDto.userId,
          quizId: createDto.quizId 
        }
      });

      if (existingAssignment) {
        throw new BadRequestException('User is already assigned to this quiz');
      }

      // Create the assignment
      const assignment = this.userQuizAssignmentRepository.create({
        userId: createDto.userId,
        quizId: createDto.quizId,
        isActive: createDto.isActive ?? true,
        assignedBy,
      });

      const savedAssignment = await this.userQuizAssignmentRepository.save(assignment);

      // Return with user and quiz details
      const result = await this.userQuizAssignmentRepository.findOne({
        where: { id: savedAssignment.id },
        relations: ['user', 'quiz'],
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    userId?: number,
    quizId?: number,
    isActive?: boolean,
  ): Promise<ApiResponse<any>> {
    const skip = (page - 1) * limit;
    const whereCondition: any = {};

    if (userId !== undefined) {
      whereCondition.userId = userId;
    }

    if (quizId !== undefined) {
      whereCondition.quizId = quizId;
    }

    if (isActive !== undefined) {
      whereCondition.isActive = isActive;
    }

    const [assignments, total] = await this.userQuizAssignmentRepository.findAndCount({
      where: whereCondition,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['user', 'quiz'],
    });

    return ResponseFactory.paginated(
      assignments,
      total,
      page,
      limit,
      'User-quiz assignments retrieved successfully'
    );
  }

  async findUserQuizzes(
    userId: number,
    page: number = 1,
    limit: number = 10,
    isActive?: boolean,
  ): Promise<ApiResponse<any>> {
    const skip = (page - 1) * limit;
    const whereCondition: any = { userId };

    if (isActive !== undefined) {
      whereCondition.isActive = isActive;
    }

    const [assignments, total] = await this.userQuizAssignmentRepository.findAndCount({
      where: whereCondition,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['quiz', 'quiz.questions', 'quiz.location'],
    });

    return ResponseFactory.paginated(
      assignments.map(assignment => assignment.quiz),
      total,
      page,
      limit,
      `Found ${total} quizzes assigned to user`
    );
  }

  async findQuizUsers(
    quizId: number,
    page: number = 1,
    limit: number = 10,
    isActive?: boolean,
  ): Promise<ApiResponse<any>> {
    const skip = (page - 1) * limit;
    const whereCondition: any = { quizId };

    if (isActive !== undefined) {
      whereCondition.isActive = isActive;
    }

    const [assignments, total] = await this.userQuizAssignmentRepository.findAndCount({
      where: whereCondition,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });

    return ResponseFactory.paginated(
      assignments.map(assignment => ({
        assignmentId: assignment.id,
        assignedAt: assignment.createdAt,
        isActive: assignment.isActive,
        user: assignment.user
      })),
      total,
      page,
      limit,
      `Found ${total} users assigned to quiz`
    );
  }

  async remove(id: number): Promise<void> {
    const assignment = await this.userQuizAssignmentRepository.findOne({
      where: { id }
    });

    if (!assignment) {
      throw new NotFoundException('User-quiz assignment not found');
    }

    await this.userQuizAssignmentRepository.remove(assignment);
  }

  async findByUserAndQuiz(userId: number, quizId: number): Promise<UserQuizAssignment | null> {
    return this.userQuizAssignmentRepository.findOne({
      where: { 
        userId,
        quizId,
        isActive: true 
      }
    });
  }
}