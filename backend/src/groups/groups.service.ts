import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { UsersService } from '../users/users.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupsRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private membersRepository: Repository<GroupMember>,
    private usersService: UsersService,
  ) {}

  async create(dto: CreateGroupDto, userId: string) {
    const group = this.groupsRepository.create({ ...dto, createdById: userId });
    const saved = await this.groupsRepository.save(group);
    const member = this.membersRepository.create({ groupId: saved.id, userId });
    await this.membersRepository.save(member);
    return saved;
  }

  async findUserGroups(userId: string) {
    const memberships = await this.membersRepository.find({
      where: { userId },
      relations: ['group', 'group.createdBy'],
    });
    return memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      description: m.group.description,
      createdById: m.group.createdById,
      createdAt: m.group.createdAt,
      createdBy: m.group.createdBy
        ? { id: m.group.createdBy.id, name: m.group.createdBy.name, email: m.group.createdBy.email }
        : null,
    }));
  }

  async findById(id: string, userId: string) {
    const group = await this.groupsRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });
    if (!group) throw new NotFoundException('Group not found');

    const memberRecord = await this.membersRepository.findOne({ where: { groupId: id, userId } });
    if (!memberRecord) throw new ForbiddenException('Not a member of this group');

    const members = await this.membersRepository.find({
      where: { groupId: id },
      relations: ['user'],
    });

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      createdById: group.createdById,
      createdAt: group.createdAt,
      createdBy: group.createdBy
        ? { id: group.createdBy.id, name: group.createdBy.name, email: group.createdBy.email }
        : null,
      members: members.map((m) => ({
        id: m.userId,
        name: m.user.name,
        email: m.user.email,
        joinedAt: m.joinedAt,
      })),
    };
  }

  async addMember(groupId: string, email: string, requesterId: string) {
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    const requesterMembership = await this.membersRepository.findOne({
      where: { groupId, userId: requesterId },
    });
    if (!requesterMembership) throw new ForbiddenException('Not a member of this group');

    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.membersRepository.findOne({
      where: { groupId, userId: user.id },
    });
    if (existing) throw new ConflictException('User is already a member');

    const member = this.membersRepository.create({ groupId, userId: user.id });
    await this.membersRepository.save(member);
    return { id: user.id, name: user.name, email: user.email };
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const member = await this.membersRepository.findOne({ where: { groupId, userId } });
    return !!member;
  }

  async getMembers(groupId: string) {
    const members = await this.membersRepository.find({
      where: { groupId },
      relations: ['user'],
    });
    return members.map((m) => ({ id: m.userId, name: m.user.name, email: m.user.email }));
  }
}
