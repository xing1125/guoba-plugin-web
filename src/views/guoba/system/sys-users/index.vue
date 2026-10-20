<template>
  <PageWrapper title="">
    <div class="db g-page">
      <!-- 页头 -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">ACCESS CONTROL</div>
          <div class="db-hero__title">后台用户</div>
          <div class="db-hero__desc"> RBAC 账号、角色与登录记录 · 菜单可见性与操作码两级权限 </div>
        </div>
        <div class="db-hero__side">
          <GSegmented :model-value="tab" :options="tabs.map((t) => ({ value: t.key, label: t.name }))" label="RBAC 视图" @update:model-value="switchTab($event as any)" />
        </div>
      </section>

      <div v-if="!canManage" class="gu-tip"> 当前角色只读，账户与角色管理仅超级管理员可用。 </div>

      <!-- 用户 -->
      <GTablePage
        v-if="tab === 'users'"
        v-model:page="userPage"
        title="账号列表"
        :icon="$gm('users')"
        :columns="userColumns"
        :data-source="users"
        :total="users.length"
        :loading="loadingUsers"
        row-key="id"
        searchable
        v-model:search-value="userKeyword"
        search-placeholder="搜索用户名 / 昵称"
        csv-name="admin-users"
        :csv-columns="userCsv"
        empty-title="还没有后台账号"
        empty-desc="点击右上角「新建用户」创建，默认超管 admin 由系统内置"
        @search="loadUsers"
        @refresh="loadUsers"
      >
        <template #toolbar>
          <Button type="primary" size="small" :disabled="!canManage" @click="openUserModal()"> 新建用户 </Button>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'role'">
            <Tag :color="roleColor(record.role)">{{ roleName(record.role) }}</Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="record.status === 'active' ? 'green' : 'red'">
              {{ record.status === 'active' ? '启用' : '停用' }}
            </Tag>
            <Tag v-if="record.must_change" color="orange">待改密</Tag>
          </template>
          <template v-else-if="column.key === 'last'">
            <span class="gu-mute">{{ shortTime(record.last_login_at) }}</span>
          </template>
          <template v-else-if="column.key === 'created'">
            <span class="gu-mute">{{ shortTime(record.created_at) }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <span class="gu-ops">
              <a :class="{ 'is-disabled': !canManage }" @click="canManage && openUserModal(record)">编辑</a>
              <a :class="{ 'is-disabled': !canManage }" @click="canManage && openReset(record)">重置密码</a>
              <a v-if="record.username !== 'admin'" class="is-danger" :class="{ 'is-disabled': !canManage }" @click="canManage && askDeleteUser(record)">删除</a>
            </span>
          </template>
          <template v-else>{{ record[column.dataIndex] ?? '-' }}</template>
        </template>
      </GTablePage>

      <!-- 角色 -->
      <GTablePage
        v-if="tab === 'roles'"
        title="角色与权限"
        :icon="$gm('shield')"
        :columns="roleColumns"
        :data-source="roles"
        :total="roles.length"
        :loading="loadingRoles"
        row-key="role"
        csv-name="admin-roles"
        :csv-columns="roleCsv"
        empty-title="暂无角色"
        @refresh="loadRoles"
      >
        <template #toolbar>
          <Button type="primary" size="small" :disabled="!canManage" @click="openRoleModal()"> 新建角色 </Button>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            {{ record.name }}
            <Tag v-if="record.builtin" color="blue" style="margin-left: 6px">内置</Tag>
          </template>
          <template v-else-if="column.key === 'menus'">
            <span class="gu-mute">{{ record.menus.includes('*') ? '全部' : `${record.menus.length} 项` }}</span>
          </template>
          <template v-else-if="column.key === 'ops'">
            <span class="gu-mute">{{ record.ops.includes('*') ? '全部' : `${record.ops.length} 项` }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <span class="gu-ops">
              <a :class="{ 'is-disabled': !canManage || record.builtin }" @click="canManage && !record.builtin && openRoleModal(record)">
                {{ record.builtin ? '内置不可改' : '编辑' }}
              </a>
              <a v-if="!record.builtin" class="is-danger" :class="{ 'is-disabled': !canManage }" @click="canManage && askDeleteRole(record)">删除</a>
            </span>
          </template>
          <template v-else>{{ record[column.dataIndex] ?? '-' }}</template>
        </template>
      </GTablePage>

      <!-- 登录日志 -->
      <GTablePage
        v-if="tab === 'log'"
        v-model:page="logPage"
        v-model:page-size="logSize"
        title="登录日志"
        :icon="$gm('login')"
        :columns="logColumns"
        :data-source="logRows"
        :total="logTotal"
        :loading="loadingLog"
        row-key="id"
        searchable
        v-model:search-value="logKeyword"
        search-placeholder="搜索用户名"
        csv-name="login-log"
        :csv-columns="logCsv"
        @search="loadLog"
        @refresh="loadLog"
      >
        <template #filters>
          <GSelect
            v-model="logSuccess"
            size="sm"
            width="108px"
            :options="[
              { label: '全部结果', value: '' },
              { label: '成功', value: 'true' },
              { label: '失败', value: 'false' },
            ]"
            @change="
              logPage = 1;
              loadLog();
            "
          />
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'success'">
            <Tag :color="record.success ? 'green' : 'red'">{{ record.success ? '成功' : '失败' }}</Tag>
          </template>
          <template v-else-if="column.key === 'ua'">
            <span class="gu-mute gu-ellipsis">{{ record.ua || '-' }}</span>
          </template>
          <template v-else>{{ record[column.dataIndex] ?? '-' }}</template>
        </template>
      </GTablePage>
    </div>

    <!-- 用户编辑弹窗 -->
    <Modal v-model:visible="userModal.open" :title="userModal.id ? '编辑用户' : '新建用户'" :width="460" :confirm-loading="userModal.saving" :mask-closable="false" @ok="saveUser">
      <div class="gu-form">
        <GField label="用户名" required hint="3-32 位字母 / 数字 / 下划线，创建后不可修改">
          <GInput v-model="userModal.username" :disabled="!!userModal.id" placeholder="如 yunzai_ops" />
        </GField>
        <GField label="昵称" hint="仅用于后台展示，可留空">
          <GInput v-model="userModal.nickname" placeholder="如 运维小王" />
        </GField>
        <GField label="角色" required hint="决定可见菜单与可执行操作">
          <GSelect v-model="userModal.role" :options="roles.map((r) => ({ label: `${r.name}（${r.role}）`, value: r.role }))" :disabled="userModal.username === 'admin'" />
        </GField>
        <GField :label="userModal.id ? '新密码' : '密码'" :required="!userModal.id" :hint="userModal.id ? '留空则保持当前密码不变' : '6 位以上；首次登录会提示改密'">
          <GInput v-model="userModal.password" type="password" :placeholder="userModal.id ? '不修改请留空' : '设置初始密码'" />
        </GField>
        <GField label="状态" hint="停用后该账号无法登录后台，权限保留">
          <GSwitch
            :model-value="userModal.status === 'active'"
            :disabled="userModal.username === 'admin'"
            checked-label="启用"
            unchecked-label="停用"
            @update:model-value="(v) => (userModal.status = v ? 'active' : 'disabled')"
          />
        </GField>
      </div>
    </Modal>

    <!-- 重置密码 -->
    <Modal v-model:visible="resetModal.open" :title="`重置 ${resetModal.username} 的密码`" :width="400" :confirm-loading="resetModal.saving" :mask-closable="false" @ok="saveReset">
      <div class="gu-form">
        <GField label="新密码" required hint="至少 6 位；保存后旧密码立即失效">
          <GInput v-model="resetModal.password" type="password" placeholder="至少 6 位" />
        </GField>
      </div>
    </Modal>

    <!-- 角色编辑 -->
    <Modal v-model:visible="roleModal.open" :title="roleModal.isNew ? '新建角色' : `编辑角色 ${roleModal.role}`" :width="620" :confirm-loading="roleModal.saving" :mask-closable="false" @ok="saveRole">
      <div class="gu-form">
        <GField label="标识" required hint="2-32 位字母 / 数字 / 下划线，创建后不可修改">
          <GInput v-model="roleModal.role" :disabled="!roleModal.isNew" placeholder="如 audit_viewer" />
        </GField>
        <GField label="名称" required hint="展示在账号列表与权限下拉里">
          <GInput v-model="roleModal.name" placeholder="如 只读审计员" />
        </GField>
        <GField label="可见菜单" hint="不勾选的菜单不会出现在侧边栏（接口层面仍按操作权限拦截）">
          <div class="gu-check">
            <GCheckbox v-for="m in catalogue.menus" :key="m.perm" :model-value="roleModal.menus.includes(m.perm)" @update:model-value="(v) => toggle(roleModal.menus, m.perm, v)">
              {{ m.name }}
            </GCheckbox>
          </div>
        </GField>
        <GField label="可执行操作" hint="未勾选的操作在写接口处一律 403">
          <div v-for="g in catalogue.ops" :key="g.group" class="gu-check-group">
            <div class="gu-check-group__title">{{ g.group }}</div>
            <div class="gu-check">
              <GCheckbox v-for="o in g.items" :key="o.op" :model-value="roleModal.ops.includes(o.op)" @update:model-value="(v) => toggle(roleModal.ops, o.op, v)">
                <span class="gu-op-name">{{ o.name }}</span>
                <code class="gu-op-code">{{ o.op }}</code>
              </GCheckbox>
            </div>
          </div>
        </GField>
      </div>
    </Modal>

    <GConfirmModal v-model:visible="confirm.open" :title="confirm.title" :content="confirm.content" :danger="confirm.danger" :loading="confirm.loading" @ok="confirm.run" />
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue';
  import { Button, Modal, Tag } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { usePermissionStore } from '/@/store/modules/permission';
  import GTablePage from '../_shared/GTablePage.vue';
  import GConfirmModal from '../_shared/dialog/GConfirmModal.vue';
  import GField from '../_shared/form/GField.vue';
  import GSelect from '../_shared/form/GSelect.vue';
  import GInput from '../_shared/form/GInput.vue';
  import GSwitch from '../_shared/form/GSwitch.vue';
  import GCheckbox from '../_shared/form/GCheckbox.vue';
  import GSegmented from '../_shared/form/GSegmented.vue';
  import { authApi, type AdminRole, type AdminUser, type Catalogue, type LoginLogRow } from './api';

  defineOptions({ name: 'SysUsers' });

  const { createMessage: $message } = useMessage();
  const permStore = usePermissionStore();

  const tabs = [
    { key: 'users', name: '账号' },
    { key: 'roles', name: '角色' },
    { key: 'log', name: '登录日志' },
  ];
  const tab = ref<'users' | 'roles' | 'log'>('users');

  const permCode = computed<string[]>(() => (permStore.getPermCodeList as string[]) || []);
  const canManage = computed(() => permCode.value.includes('*') || permCode.value.includes('sys:write'));

  /* ------------------------------ 用户 ------------------------------ */
  const users = ref<AdminUser[]>([]);
  const loadingUsers = ref(false);
  const userKeyword = ref('');
  const userPage = ref(1);

  const userColumns = [
    { title: '用户名', dataIndex: 'username', key: 'username', width: 140 },
    { title: '昵称', dataIndex: 'nickname', key: 'nickname', width: 140 },
    { title: '角色', key: 'role', width: 120 },
    { title: '状态', key: 'status', width: 150 },
    { title: '最后登录', key: 'last', width: 160 },
    { title: '创建时间', key: 'created', width: 160 },
    { title: '操作', key: 'action', width: 190 },
  ];

  const userCsv = [
    { title: '用户名', key: 'username' },
    { title: '昵称', key: 'nickname' },
    { title: '角色', format: (r: AdminUser) => roleName(r.role) },
    { title: '状态', format: (r: AdminUser) => (r.status === 'active' ? '启用' : '停用') },
    { title: '最后登录', key: 'last_login_at' },
    { title: '创建时间', key: 'created_at' },
  ];

  async function loadUsers() {
    loadingUsers.value = true;
    try {
      users.value = (await authApi.getUsers(userKeyword.value)) || [];
    } catch (e: any) {
      $message.error(e?.message || '加载用户失败');
    } finally {
      loadingUsers.value = false;
    }
  }

  /* ------------------------------ 角色 ------------------------------ */
  const roles = ref<AdminRole[]>([]);
  const loadingRoles = ref(false);
  const catalogue = ref<Catalogue>({ menus: [], ops: [] });

  const roleColumns = [
    { title: '标识', dataIndex: 'role', key: 'role', width: 140 },
    { title: '名称', key: 'name', width: 200 },
    { title: '菜单', key: 'menus', width: 100 },
    { title: '操作码', key: 'ops', width: 100 },
    { title: '说明', dataIndex: 'description', key: 'description' },
    { title: '操作', key: 'action', width: 160 },
  ];

  const roleCsv = [
    { title: '标识', key: 'role' },
    { title: '名称', key: 'name' },
    { title: '菜单', format: (r: AdminRole) => (r.menus || []).join('|') },
    { title: '操作码', format: (r: AdminRole) => (r.ops || []).join('|') },
    { title: '内置', format: (r: AdminRole) => (r.builtin ? '是' : '否') },
    { title: '说明', key: 'description' },
  ];

  async function loadRoles() {
    loadingRoles.value = true;
    try {
      roles.value = (await authApi.getRoles()) || [];
    } catch (e: any) {
      $message.error(e?.message || '加载角色失败');
    } finally {
      loadingRoles.value = false;
    }
  }

  async function loadCatalogue() {
    try {
      catalogue.value = (await authApi.getCatalogue()) || { menus: [], ops: [] };
    } catch {
      /* 目录拉取失败不阻断列表 */
    }
  }

  function roleName(role: string): string {
    return roles.value.find((r) => r.role === role)?.name || role;
  }

  function roleColor(role: string): string {
    return role === 'super' ? 'red' : role === 'admin' ? 'blue' : 'default';
  }

  /* ------------------------------ 登录日志 ------------------------------ */
  const logRows = ref<LoginLogRow[]>([]);
  const logTotal = ref(0);
  const logPage = ref(1);
  const logSize = ref(20);
  const logKeyword = ref('');
  const logSuccess = ref<string>('');
  const loadingLog = ref(false);

  const logColumns = [
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 170 },
    { title: '用户名', dataIndex: 'username', key: 'username', width: 130 },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 140 },
    { title: '结果', key: 'success', width: 90 },
    { title: '原因', dataIndex: 'reason', key: 'reason', width: 180 },
    { title: 'User-Agent', key: 'ua' },
  ];

  const logCsv = [
    { title: '时间', key: 'created_at' },
    { title: '用户名', key: 'username' },
    { title: 'IP', key: 'ip' },
    { title: '结果', format: (r: LoginLogRow) => (r.success ? '成功' : '失败') },
    { title: '原因', key: 'reason' },
    { title: 'User-Agent', key: 'ua' },
  ];

  async function loadLog() {
    loadingLog.value = true;
    try {
      const res = await authApi.getLoginLog({
        page: logPage.value,
        size: logSize.value,
        username: logKeyword.value,
        success: logSuccess.value === '' ? '' : logSuccess.value === 'true',
      });
      logRows.value = res?.list || [];
      logTotal.value = res?.total || 0;
    } catch (e: any) {
      $message.error(e?.message || '加载登录日志失败');
    } finally {
      loadingLog.value = false;
    }
  }

  /* ------------------------------ 交互 ------------------------------ */
  function switchTab(key: 'users' | 'roles' | 'log') {
    tab.value = key;
    if (key === 'users') loadUsers();
    else if (key === 'roles') loadRoles();
    else loadLog();
  }

  const userModal = reactive({
    open: false,
    saving: false,
    id: 0,
    username: '',
    nickname: '',
    role: 'viewer',
    password: '',
    status: 'active' as 'active' | 'disabled',
  });

  function openUserModal(record?: AdminUser) {
    Object.assign(userModal, {
      open: true,
      saving: false,
      id: record?.id || 0,
      username: record?.username || '',
      nickname: record?.nickname || '',
      role: record?.role || 'viewer',
      password: '',
      status: record?.status || 'active',
    });
  }

  async function saveUser() {
    if (!userModal.username.trim()) return $message.warning('请输入用户名');
    if (!userModal.id && userModal.password.length < 6) return $message.warning('密码至少 6 位');
    userModal.saving = true;
    try {
      if (userModal.id) {
        const payload: Record<string, any> = {
          nickname: userModal.nickname,
          role: userModal.role,
          status: userModal.status,
        };
        if (userModal.password) payload.password = userModal.password;
        await authApi.updateUser(userModal.id, payload);
      } else {
        await authApi.createUser({
          username: userModal.username.trim(),
          password: userModal.password,
          nickname: userModal.nickname,
          role: userModal.role,
        });
      }
      $message.success('已保存');
      userModal.open = false;
      await loadUsers();
    } catch (e: any) {
      $message.error(e?.message || '保存失败');
    } finally {
      userModal.saving = false;
    }
  }

  const resetModal = reactive({ open: false, saving: false, id: 0, username: '', password: '' });

  function openReset(record: AdminUser) {
    Object.assign(resetModal, { open: true, saving: false, id: record.id, username: record.username, password: '' });
  }

  async function saveReset() {
    if (resetModal.password.length < 6) return $message.warning('新密码至少 6 位');
    resetModal.saving = true;
    try {
      await authApi.updateUser(resetModal.id, { password: resetModal.password });
      $message.success('密码已重置');
      resetModal.open = false;
    } catch (e: any) {
      $message.error(e?.message || '重置失败');
    } finally {
      resetModal.saving = false;
    }
  }

  const roleModal = reactive({
    open: false,
    saving: false,
    isNew: false,
    role: '',
    name: '',
    menus: [] as string[],
    ops: [] as string[],
  });

  function openRoleModal(record?: AdminRole) {
    Object.assign(roleModal, {
      open: true,
      saving: false,
      isNew: !record,
      role: record?.role || '',
      name: record?.name || '',
      menus: [...(record?.menus || [])],
      ops: [...(record?.ops || [])],
    });
  }

  function toggle(list: string[], value: string, checked: boolean) {
    const i = list.indexOf(value);
    if (checked && i < 0) list.push(value);
    if (!checked && i >= 0) list.splice(i, 1);
  }

  async function saveRole() {
    if (!roleModal.role.trim()) return $message.warning('请输入角色标识');
    roleModal.saving = true;
    try {
      await authApi.saveRole({
        role: roleModal.role.trim(),
        name: roleModal.name || roleModal.role,
        menus: roleModal.menus,
        ops: roleModal.ops,
      });
      $message.success('已保存');
      roleModal.open = false;
      await loadRoles();
    } catch (e: any) {
      $message.error(e?.message || '保存失败');
    } finally {
      roleModal.saving = false;
    }
  }

  const confirm = reactive({
    open: false,
    loading: false,
    title: '',
    content: '',
    danger: true,
    run: async () => {},
  });

  function askDeleteUser(record: AdminUser) {
    Object.assign(confirm, {
      open: true,
      loading: false,
      title: '删除后台账号',
      content: `确认删除后台账号「${record.username}」？该账号将立即失去登录能力。`,
      danger: true,
      run: async () => {
        confirm.loading = true;
        try {
          await authApi.deleteUser(record.id);
          $message.success('已删除');
          confirm.open = false;
          await loadUsers();
        } catch (e: any) {
          $message.error(e?.message || '删除失败');
        } finally {
          confirm.loading = false;
        }
      },
    });
  }

  function askDeleteRole(record: AdminRole) {
    Object.assign(confirm, {
      open: true,
      loading: false,
      title: '删除角色',
      content: `确认删除角色「${record.name}」？角色下仍有用户时将被拒绝。`,
      danger: true,
      run: async () => {
        confirm.loading = true;
        try {
          await authApi.deleteRole(record.role);
          $message.success('已删除');
          confirm.open = false;
          await loadRoles();
        } catch (e: any) {
          $message.error(e?.message || '删除失败');
        } finally {
          confirm.loading = false;
        }
      },
    });
  }

  function shortTime(t?: string) {
    if (!t) return '-';
    return String(t).replace('T', ' ').slice(0, 19);
  }

  onMounted(async () => {
    await Promise.all([loadRoles(), loadCatalogue()]);
    await loadUsers();
  });
</script>

<style lang="less" scoped>
  .gu-tip {
    padding: 8px 12px;
    font-size: 12.5px;
    color: var(--g-amber);
    background: rgb(168 129 63 / 10%);
    border: 1px solid rgb(168 129 63 / 26%);
    border-radius: 8px;
  }

  .gu-mute {
    color: var(--g-text-mute);
  }

  .gu-ellipsis {
    display: inline-block;
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .gu-ops {
    display: flex;
    gap: 10px;
    font-size: 12.5px;

    a {
      color: var(--g-blue);
      cursor: pointer;

      &.is-danger {
        color: #d9534f;
      }

      &.is-disabled {
        color: var(--g-text-mute);
        cursor: not-allowed;
      }
    }
  }

  .gu-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .gu-check {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
  }

  .gu-check-group {
    margin-bottom: 10px;
  }

  .gu-check-group__title {
    margin-bottom: 6px;
    font-size: 12px;
    color: var(--g-text-mute);
  }

  .gu-op-name {
    font-size: 12.5px;
  }

  .gu-op-code {
    margin-left: 6px;
    font-size: 11px;
    color: var(--g-text-mute);
  }
</style>
